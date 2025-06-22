import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataSourceService } from './data-source.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateDataSourceDto, UpdateDataSourceDto, CreateDataStreamDto } from './dto/data-source.dto';
import { DataGateway } from '../../interfaces/websocket/data.gateway';
import { DataSourceStatus } from '@prisma/client';

@ApiTags('Data Sources')
@Controller('data-sources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DataSourceController {
  constructor(
    private readonly dataSourceService: DataSourceService,
    private readonly dataGateway: DataGateway
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new data source' })
  @ApiResponse({ status: 201, description: 'Data source created' })
  async create(@Body() createDto: CreateDataSourceDto) {
    const result = await this.dataSourceService.create(createDto);
    await this.dataGateway.broadcastToOrg(createDto.orgId, 'dataSourceCreated', result);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get data source by ID' })
  @ApiResponse({ status: 200, description: 'Data source found' })
  async findById(@Param('id') id: string) {
    return this.dataSourceService.findById(id);
  }

  @Get('organization/:orgId')
  @ApiOperation({ summary: 'Get all data sources for an organization' })
  @ApiResponse({ status: 200, description: 'Data sources found' })
  async findByOrganization(@Param('orgId') orgId: string) {
    return this.dataSourceService.findByOrganization(orgId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update data source' })
  @ApiResponse({ status: 200, description: 'Data source updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: {
      name?: string;
      config?: Record<string, any>;
      status?: DataSourceStatus;
    },
  ) {
    return this.dataSourceService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete data source' })
  @ApiResponse({ status: 200, description: 'Data source deleted' })
  async delete(@Param('id') id: string) {
    return this.dataSourceService.delete(id);
  }

  @Post(':id/streams')
  @ApiOperation({ summary: 'Create a new data stream' })
  @ApiResponse({ status: 201, description: 'Data stream created' })
  async createStream(
    @Param('id') id: string,
    @Body() createDto: {
      name: string;
      schema: Record<string, any>;
      transformations?: Record<string, any>;
    },
  ) {
    return this.dataSourceService.createStream(id, createDto);
  }
}
