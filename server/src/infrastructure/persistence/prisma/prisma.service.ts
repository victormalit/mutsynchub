import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PerformanceMiddleware } from './middleware/performance.middleware';
import { ErrorHandlingMiddleware } from './middleware/error-handling.middleware';
import { AuditPrismaMiddleware } from './middleware/audit-prisma.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isQueryLoggingEnabled = false;
  private performanceMiddleware: PerformanceMiddleware;
  private errorHandlingMiddleware: ErrorHandlingMiddleware;
  private auditPrismaMiddleware?: AuditPrismaMiddleware;

  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'minimal',
    });
    this.performanceMiddleware = new PerformanceMiddleware(this.logger, {
      slowQueryThreshold: process.env.SLOW_QUERY_THRESHOLD ?
        parseInt(process.env.SLOW_QUERY_THRESHOLD, 10) : 1000,
      enableMetrics: process.env.NODE_ENV !== 'production',
    });
    this.errorHandlingMiddleware = new ErrorHandlingMiddleware(this.logger);
    this.setupMiddleware();
  }

  setAuditPrismaMiddleware(middleware: AuditPrismaMiddleware) {
    this.auditPrismaMiddleware = middleware;
    this.$use(async (params, next) => {
      return this.auditPrismaMiddleware!.handle(params, next);
    });
  }

  private setupMiddleware() {
    // Performance monitoring middleware
    this.$use(async (params, next) => {
      return this.performanceMiddleware.handle(params, next);
    });
    // Error handling middleware
    this.$use(async (params, next) => {
      return this.errorHandlingMiddleware.handle(params, next);
    });
  }

  async enableQueryLogging() {
    if (process.env.NODE_ENV === 'development') {
      this.isQueryLoggingEnabled = true;
      this.logger.log('Query performance monitoring enabled');
    }
  }

  async disableQueryLogging() {
    this.isQueryLoggingEnabled = false;
    this.logger.log('Query performance monitoring disabled');
  }

  async onModuleInit() {
    await this.$connect();
    if (process.env.NODE_ENV === 'development') {
      await this.enableQueryLogging();
    }
  }

  async onModuleDestroy() {
    await this.disableQueryLogging();
    await this.$disconnect();
  }

  async clearDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear database in production');
    }

    this.logger.warn('Cleaning database in test environment');
    
    return this.$transaction([
      this.analyticsSchedule.deleteMany(),
      // Add other models from your schema as needed
    ]);
  }

  async createTransaction<T>(fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>): Promise<T> {
    return this.$transaction(async (prisma) => {
      return fn(prisma as Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>);
    });
  }

  async isDatabaseActive(): Promise<boolean> {
    const startTime = Date.now();
    try {
      await this.$queryRaw(Prisma.sql`SELECT 1`);

      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        this.logger.warn('Slow query detected', {
          duration,
          threshold: 1000,
          query: 'SELECT 1'
        });
      }
      
      this.logger.log('Database health check: OK');
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  getQueryStats() {
    return this.performanceMiddleware.getQueryStats();
  }

  resetQueryStats() {
    this.performanceMiddleware.resetStats();
  }

  // Analytics Schedule operations
  async createAnalyticsSchedule(data: any) {
    return this.analyticsSchedule.create({ data });
  }

  async getAnalyticsSchedules(orgId: string) {
    return this.analyticsSchedule.findMany({ where: { orgId } });
  }

  async updateAnalyticsSchedule(id: string, data: any) {
    return this.analyticsSchedule.update({ where: { id }, data });
  }

  async deleteAnalyticsSchedule(id: string) {
    return this.analyticsSchedule.delete({ where: { id } });
  }
}
