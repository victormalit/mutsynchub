import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { DataSourceType, DataSourceStatus, Prisma } from '@prisma/client';
import { DataGateway } from '../../interfaces/websocket/data.gateway';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DataSourceService {
  private readonly logger = new Logger(DataSourceService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataGateway: DataGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: {
    name: string;
    type: DataSourceType;
    orgId: string;
    config: Record<string, any>;
  }) {
    this.logger.log(`Creating new data source: ${data.name} for organization: ${data.orgId}`);

    const correlationId = uuidv4();
    
    try {
      // Validate configuration based on source type
      await this.validateSourceConfig(data.type, data.config);

      // Start a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the data source
        const dataSource = await tx.dataSource.create({
          data: {
            ...data,
            status: DataSourceStatus.ACTIVE,
          },
        });

        // Create audit log entry
        await tx.auditLog.create({
          data: {
            action: 'CREATE_DATA_SOURCE',
            resource: `dataSource:${dataSource.id}`,
            details: {
              correlationId,
              dataSourceName: data.name,
              type: data.type,
              config: this.sanitizeConfig(data.config),
            },
            user: {
              // Replace 'userId' with the actual user ID or user object as required by your schema
              connect: { id: 'REPLACE_WITH_USER_ID' },
            },
          },
        });

        return dataSource;
      });

      // Invalidate cache
      await this.cacheManager.del(`org:${data.orgId}:dataSources`);

      // Emit event for other services
      this.eventEmitter.emit('dataSource.created', {
        correlationId,
        dataSource: result,
        orgId: data.orgId,
      });

      // Send real-time notification
      await this.dataGateway.broadcastToOrg(data.orgId, 'dataSource:created', {
        correlationId,
        dataSource: result,
      });

      this.logger.log(`Data source created successfully: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create data source: ${(error as any).message}`, {
        correlationId,
        error,
        data: this.sanitizeConfig(data),
      });
      throw error;
    }
  }

  async findById(id: string) {
    const dataSource = await this.prisma.dataSource.findUnique({
      where: { id },
      include: {
        dataStreams: true,
      },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    return dataSource;
  }

  async findByOrganization(orgId: string) {
    this.logger.debug(`Fetching data sources for organization: ${orgId}`);
    try {
      return await this.getCachedDataSources(orgId);
    } catch (error) {
      this.logger.error(`Failed to fetch data sources for organization: ${orgId}`, error);
      throw error;
    }
  }
  
  private async validateSourceConfig(type: DataSourceType, config: Record<string, any>): Promise<void> {
    switch (type) {
      case 'API':
        if (!config.endpoint || !config.apiKey) {
          throw new ConflictException('API data source requires endpoint and apiKey');
        }
        // Validate endpoint is accessible
        try {
          const response = await fetch(config.endpoint, {
            method: 'HEAD',
            headers: { 'Authorization': `Bearer ${config.apiKey}` },
          });
          if (!response.ok) {
            throw new ConflictException('API endpoint is not accessible');
          }
        } catch (error) {
          throw new ConflictException('Failed to validate API endpoint');
        }
        break;

      case 'DATABASE':
        if (!config.connectionString && (!config.host || !config.database || !config.username)) {
          throw new ConflictException('Database source requires either connectionString or host/database/username');
        }
        // Test database connection
        try {
          // Implement database connection test based on the database type
        } catch (error) {
          throw new ConflictException('Failed to validate database connection');
        }
        break;

      case DataSourceType.FILE_IMPORT:
        if (!config.path && !config.bucketName) {
          throw new ConflictException('File source requires either local path or S3 bucket name');
        }
        // Validate file/bucket accessibility
        break;

      default:
        throw new ConflictException(`Unsupported data source type: ${type}`);
    }
  }

  private sanitizeConfig(config: Record<string, any>): Record<string, any> {
    const sanitized = { ...config };
    const sensitiveKeys = ['apiKey', 'password', 'secret', 'token', 'connectionString'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        sanitized[key] = '***********';
      }
    }
    
    return sanitized;
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async cleanupStaleDataSources() {
    this.logger.log('Running stale data source cleanup job');
    
    try {
      const staleThreshold = new Date();
      staleThreshold.setDate(staleThreshold.getDate() - 30); // 30 days

      const staleSources = await this.prisma.dataSource.findMany({
        where: {
          AND: [
            { status: DataSourceStatus.ACTIVE },
            { lastSyncAt: { lt: staleThreshold } },
          ],
        },
      });

      for (const source of staleSources) {
        await this.prisma.dataSource.update({
          where: { id: source.id },
          data: { status: DataSourceStatus.INACTIVE },
        });

        this.eventEmitter.emit('dataSource.deactivated', {
          dataSourceId: source.id,
          orgId: source.orgId,
          reason: 'STALE_DATA',
        });
      }

      this.logger.log(`Deactivated ${staleSources.length} stale data sources`);
    } catch (error) {
      this.logger.error('Failed to cleanup stale data sources', error);
    }
  }

  private async getCachedDataSources(orgId: string) {
    const cacheKey = `org:${orgId}:dataSources`;
    let dataSources = await this.cacheManager.get(cacheKey);

    if (!dataSources) {
      dataSources = await this.prisma.dataSource.findMany({
        where: { orgId },
        include: { dataStreams: true },
      });
      await this.cacheManager.set(cacheKey, dataSources, this.CACHE_TTL);
    }

    return dataSources;
  }

  // --- STUBS ADDED FOR CONTROLLER ---
  async update(id: string, updateDto: any) {
    this.logger.warn('update() stub called. Implement logic as needed.');
    // TODO: Implement update logic
    return { id, ...updateDto };
  }

  async delete(id: string) {
    this.logger.warn('delete() stub called. Implement logic as needed.');
    // TODO: Implement delete logic
    return { id, deleted: true };
  }

  async createStream(id: string, createDto: any) {
    this.logger.warn('createStream() stub called. Implement logic as needed.');
    // TODO: Implement createStream logic
    return { dataSourceId: id, ...createDto };
  }
}
