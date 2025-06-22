import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Load configuration with defaults
    this.maxAttempts = this.configService.get('AUTH_MAX_ATTEMPTS', 5);
    this.windowMs = this.configService.get('AUTH_WINDOW_MS', 300000); // 5 minutes
    this.blockDurationMs = this.configService.get('AUTH_BLOCK_DURATION_MS', 900000); // 15 minutes
  }

  async checkRateLimit(identifier: string, ipAddress: string): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.windowMs);

    // Check for existing block
    const block = await this.prisma.rateLimit.findFirst({
      where: {
        identifier,
        blockedUntil: {
          gt: now,
        },
      },
    });

    if (block) {
      this.logger.warn(`Access blocked for identifier: ${identifier}, IP: ${ipAddress}`);
      return false;
    }

    // Count attempts within window
    const attempts = await this.prisma.rateLimit.count({
      where: {
        identifier,
        createdAt: {
          gt: windowStart,
        },
      },
    });

    // Record this attempt
    await this.prisma.rateLimit.create({
      data: {
        identifier,
        ipAddress,
      },
    });

    if (attempts >= this.maxAttempts) {
      // Block further attempts
      const blockedUntil = new Date(now.getTime() + this.blockDurationMs);
      await this.prisma.rateLimit.create({
        data: {
          identifier,
          ipAddress,
          blockedUntil,
        },
      });

      this.logger.warn(`Rate limit exceeded for identifier: ${identifier}, IP: ${ipAddress}`);
      return false;
    }

    return true;
  }

  async cleanupOldRecords(): Promise<void> {
    const cutoff = new Date(Date.now() - this.windowMs);
    await this.prisma.rateLimit.deleteMany({
      where: {
        AND: [
          {
            createdAt: {
              lt: cutoff,
            },
          },
          {
            blockedUntil: null,
          },
        ],
      },
    });
  }
}
