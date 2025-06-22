import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRedis } from '@nestjs/redis';
import Redis from 'ioredis';

@Injectable()
export class AnalyticsCacheService {
  private readonly logger = new Logger(AnalyticsCacheService.name);
  private readonly TTL = 24 * 60 * 60; // 24 hours in seconds

  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async cacheAnalysisResult(key: string, result: any): Promise<void> {
    try {
      await this.redis.setex(
        `analysis:${key}`,
        this.TTL,
        JSON.stringify(result)
      );
      this.logger.debug(`Cached analysis result for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error caching analysis result: ${error.message}`);
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
      this.logger.error(`Error retrieving cached analysis: ${error.message}`);
      return null;
    }
  }

  async invalidateCache(key: string): Promise<void> {
    try {
      await this.redis.del(`analysis:${key}`);
      this.logger.debug(`Invalidated cache for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache: ${error.message}`);
      throw error;
    }
  }

  generateCacheKey(datasetId: string, analysisType: string, params: any): string {
    const paramHash = JSON.stringify(params);
    return `${datasetId}:${analysisType}:${paramHash}`;
  }
}
