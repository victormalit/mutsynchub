import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenBlacklistService implements OnModuleInit {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      keyPrefix: 'blacklist:',
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Handle Redis connection errors
    this.redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  async blacklist(token: string, expirationTime?: number): Promise<void> {
    const ttl = expirationTime || 604800; // Default 7 days
    await this.redisClient.set(token, '1', 'EX', ttl);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redisClient.exists(token);
    return exists === 1;
  }

  async clearBlacklist(): Promise<void> {
    const keys = await this.redisClient.keys('*');
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }
}
