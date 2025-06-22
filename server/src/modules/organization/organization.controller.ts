import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgStatus } from '@prisma/client';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization found' })
  async findById(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }

  @Get('subdomain/:subdomain')
  @ApiOperation({ summary: 'Get organization by subdomain' })
  @ApiResponse({ status: 200, description: 'Organization found' })
  async findBySubdomain(@Param('subdomain') subdomain: string) {
    return this.organizationService.findBySubdomain(subdomain);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: {
      name?: string;
      settings?: Record<string, any>;
      status?: OrgStatus;
    },
  ) {
    return this.organizationService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization' })
  @ApiResponse({ status: 200, description: 'Organization deleted' })
  async delete(@Param('id') id: string) {
    return this.organizationService.delete(id);
  }
}
