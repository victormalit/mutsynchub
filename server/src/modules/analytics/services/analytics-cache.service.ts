import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class AnalyticsCacheService {
  private readonly logger = new Logger(AnalyticsCacheService.name);
  private readonly TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly redis: Redis;

  constructor() {
    // You can configure the Redis connection string as needed
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async cacheAnalysisResult(key: string, result: any): Promise<void> {
    try {
      await this.redis.setex(
        `analysis:${key}`,
        this.TTL,
        JSON.stringify(result)
      );
      this.logger.debug(`Cached analysis result for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error caching analysis result: ${(error as any).message}`);
      throw error;
    }
  }

  async getCachedAnalysis(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(`analysis:${key}`);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      this.logger.error(`Error retrieving cached analysis: ${(error as any).message}`);
      return null;
    }
  }

  async invalidateCache(key: string): Promise<void> {
    try {
      await this.redis.del(`analysis:${key}`);
      this.logger.debug(`Invalidated cache for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache: ${(error as any).message}`);
      throw error;
    }
  }

  generateCacheKey(datasetId: string, analysisType: string, params: any): string {
    const paramHash = JSON.stringify(params);
    return `${datasetId}:${analysisType}:${paramHash}`;
  }
}
