import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SubscriptionTierGuard, RequiredSubscriptionTier } from '../../common/guards/subscription-tier.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsScheduleService } from './analytics-schedule.service';
import { AnalyticsService } from './analytics.service';
import { QueryInterpreterService } from './services/query-interpreter.service';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/analytics-schedule.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsScheduleService: AnalyticsScheduleService,
    private readonly analyticsService: AnalyticsService,
    private readonly queryInterpreterService: QueryInterpreterService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('schedule')
  @ApiOperation({ summary: 'Create a new analytics schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  async createSchedule(@Body() data: CreateScheduleDto) {
    // Frequency limits are enforced in the service
    return this.analyticsScheduleService.createSchedule(data.orgId, {
      frequency: data.frequency,
      interval: data.interval,
    });
  }

  @Get('schedule/:orgId')
  @ApiOperation({ summary: 'Get all analytics schedules for an organization' })
  async getSchedules(@Param('orgId') orgId: string) {
    return this.analyticsScheduleService.getSchedules(orgId);
  }

  @Put('schedule/:id')
  @ApiOperation({ summary: 'Update an analytics schedule' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() data: UpdateScheduleDto
  ) {
    return this.analyticsScheduleService.updateSchedule(id, data);
  }

  @Delete('schedule/:id')
  @ApiOperation({ summary: 'Delete an analytics schedule' })
  async deleteSchedule(@Param('id') id: string) {
    return this.analyticsScheduleService.deleteSchedule(id);
  }

  @Post('query')
  @ApiOperation({ summary: 'Process natural language analytics query' })
  @ApiResponse({ status: 200, description: 'Query processed successfully' })
  @RequiredSubscriptionTier('BUSINESS')
  async processQuery(@Body() queryDto: AnalyticsQueryDto) {
    // First, interpret the query using LLM
    const interpretation = await this.queryInterpreterService.interpretQuery(queryDto.query);

    // If the query is a forecasting request, restrict to BUSINESS and CORPORATE
    if (interpretation.analysisType === 'forecasting') {
      // The guard will enforce BUSINESS+ access
    }

    // Get the dataset or use all available datasets
    const datasets = queryDto.datasetId
      ? [await this.prisma.dataset.findUnique({ where: { id: queryDto.datasetId } })]
      : await this.prisma.dataset.findMany({ where: { orgId: queryDto.orgId } });

    // Process each dataset with the interpreted query
    const results = await Promise.all(datasets.map(async (dataset) => {
      const analysisResult = await this.analyticsService.performAnalysis({
        dataset,
        type: interpretation.analysisType,
        parameters: interpretation.parameters,
        metrics: interpretation.metrics,
      });

      // Store the result
      await this.prisma.analyticsReport.create({
        data: {
          name: `Query Analysis - ${interpretation.analysisType}`,
          description: queryDto.query,
          orgId: queryDto.orgId,
          type: 'query',
          config: {
            query: queryDto.query,
            interpretation,
          },
          results: analysisResult as any,  // TODO: Define proper type for analysis results
        },
      });

      return {
        datasetName: dataset.name,
        result: analysisResult,
      };
    }));

    return {
      interpretation,
      results,
    };
  }

  @Get('query/history/:orgId')
  @ApiOperation({ summary: 'Get history of analytics queries' })
  async getQueryHistory(@Param('orgId') orgId: string) {
    return this.prisma.analyticsReport.findMany({
      where: { 
        orgId,
        type: 'query',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
