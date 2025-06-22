import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface PerformanceConfig {
  slowQueryThreshold?: number;  // in milliseconds
  enableMetrics?: boolean;
}

export class PerformanceMiddleware {
  private readonly slowQueryThreshold: number;
  private readonly enableMetrics: boolean;
  private queryStats: Map<string, { count: number; totalDuration: number; slowQueries: number }>;

  constructor(
    private readonly logger: Logger,
    config: PerformanceConfig = {}
  ) {
    this.slowQueryThreshold = config.slowQueryThreshold || 1000;
    this.enableMetrics = config.enableMetrics ?? true;
    this.queryStats = new Map();
  }

  handle = async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>
  ) => {
    const startTime = Date.now();
    const operationKey = `${params.model}.${params.action}`;

    try {
      const result = await next(params);
      const duration = Date.now() - startTime;
      
      if (this.enableMetrics) {
        this.updateMetrics(operationKey, duration);
      }
      
      if (duration > this.slowQueryThreshold) {
        this.logger.warn('Slow query detected', {
          model: params.model,
          action: params.action,
          duration,
          threshold: this.slowQueryThreshold,
          args: params.args
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (this.enableMetrics) {
        this.updateMetrics(operationKey, duration);
      }

      let errorMessage = '';
      if (typeof error === 'object' && error && 'message' in error) {
        errorMessage = (error as any).message;
      } else {
        errorMessage = String(error);
      }
      this.logger.error('Query failed', {
        model: params.model,
        action: params.action,
        duration,
        args: params.args,
        error: errorMessage
      });
      throw error;
    }
  };

  private updateMetrics(operationKey: string, duration: number): void {
    const stats = this.queryStats.get(operationKey) || {
      count: 0,
      totalDuration: 0,
      slowQueries: 0
    };

    stats.count++;
    stats.totalDuration += duration;
    if (duration > this.slowQueryThreshold) {
      stats.slowQueries++;
    }

    this.queryStats.set(operationKey, stats);
  }

  getQueryStats() {
    const statsObject: Record<string, {
      count: number;
      averageDuration: number;
      slowQueries: number;
    }> = {};

    this.queryStats.forEach((stats, key) => {
      statsObject[key] = {
        count: stats.count,
        averageDuration: Math.round(stats.totalDuration / stats.count),
        slowQueries: stats.slowQueries
      };
    });

    return statsObject;
  }

  resetStats(): void {
    this.queryStats.clear();
  }
}
