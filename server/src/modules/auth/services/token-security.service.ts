import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { TokenBlacklistService } from './token-blacklist.service';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

@Injectable()
export class TokenSecurityService {
  private readonly logger = new Logger(TokenSecurityService.name);
  private readonly tokenFingerprints: Map<string, string> = new Map();
  private readonly rateLimiter: RateLimiterRedis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    // Initialize rate limiter
    const redisClient = new Redis(this.configService.get('REDIS_URL'));
    this.rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'token_validation',
      points: 10, // 10 attempts
      duration: 60, // per 60 seconds
    });
  }

  async generateSecureToken(payload: any, expiresIn: string, deviceContext?: any): Promise<{ token: string; fingerprint: string }> {
    // Generate a random fingerprint with device context
    const contextData = deviceContext ? JSON.stringify(deviceContext) : '';
    const fingerprint = crypto.randomBytes(32).toString('hex');
    const fingerprintHash = this.generateFingerprintHash(fingerprint, contextData);

    // Add enhanced security fields to payload
    const securePayload = {
      ...payload,
      fph: fingerprintHash,
      jti: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000),
      rot: 0, // Rotation count
    };

    const token = jwt.sign(securePayload, this.configService.get('JWT_SECRET'), {
      expiresIn,
      algorithm: 'RS256',
    });

    // Store fingerprint with device context
    this.tokenFingerprints.set(securePayload.jti, JSON.stringify({
      hash: fingerprintHash,
      context: deviceContext,
    }));

    // Log token creation with enhanced details
    await this.prisma.auditLog.create({
      data: {
        userId: payload.sub,
        action: 'TOKEN_CREATED',
        resource: 'AUTH',
        details: {
          tokenId: securePayload.jti,
          expiresIn,
          issuedAt: new Date(securePayload.iat * 1000),
          deviceContext: deviceContext || 'none',
        },
      },
    });

    return { token, fingerprint };
  }

  private generateFingerprintHash(fingerprint: string, contextData: string): string {
    return crypto
      .createHash('sha256')
      .update(`${fingerprint}:${contextData}`)
      .digest('hex');
  }

  async validateToken(token: string, fingerprint: string, deviceContext?: any): Promise<boolean> {
    try {
      // Apply rate limiting
      await this.rateLimiter.consume(fingerprint);

      const decoded = jwt.verify(token, this.configService.get('JWT_PUBLIC_KEY')) as any;

      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Verify fingerprint with device context
      const contextData = deviceContext ? JSON.stringify(deviceContext) : '';
      const fingerprintHash = this.generateFingerprintHash(fingerprint, contextData);
      
      if (decoded.fph !== fingerprintHash) {
        this.logger.warn(`Token fingerprint mismatch for token ID: ${decoded.jti}`);
        throw new UnauthorizedException('Invalid token fingerprint');
      }

      // Check if token needs rotation
      const shouldRotate = this.shouldRotateToken(decoded);
      if (shouldRotate) {
        return await this.rotateToken(decoded, fingerprint, deviceContext);
      }

      // Log successful validation with context
      await this.prisma.auditLog.create({
        data: {
          userId: decoded.sub,
          action: 'TOKEN_VALIDATED',
          resource: 'AUTH',
          details: {
            tokenId: decoded.jti,
            validatedAt: new Date(),
            deviceContext: deviceContext || 'none',
            rotationCount: decoded.rot || 0,
          },
        },
      });

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Token validation error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private shouldRotateToken(decoded: any): boolean {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - decoded.iat;
    const halfLife = decoded.iat + (expiresIn / 2);
    
    return now >= halfLife && (!decoded.rot || decoded.rot < 3); // Allow max 3 rotations
  }

  private async rotateToken(decoded: any, fingerprint: string, deviceContext?: any): Promise<boolean> {
    // Blacklist the old token
    await this.revokeToken(jwt.sign(decoded, this.configService.get('JWT_SECRET')), decoded.sub);
    
    // Generate new token with incremented rotation count
    const newToken = await this.generateSecureToken(
      { ...decoded, rot: (decoded.rot || 0) + 1 },
      `${decoded.exp - Math.floor(Date.now() / 1000)}s`,
      deviceContext
    );

    // Log token rotation
    await this.prisma.auditLog.create({
      data: {
        userId: decoded.sub,
        action: 'TOKEN_ROTATED',
        resource: 'AUTH',
        details: {
          oldTokenId: decoded.jti,
          newTokenId: decoded.jti,
          rotationCount: (decoded.rot || 0) + 1,
          deviceContext: deviceContext || 'none',
        },
      },
    });

    return true;
  }

  async revokeToken(token: string, userId: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      await this.tokenBlacklistService.blacklist(token);

      // Log token revocation
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'TOKEN_REVOKED',
          resource: 'AUTH',
          details: {
            tokenId: decoded?.jti,
            revokedAt: new Date(),
          },
        },
      });
    } catch (error) {
      this.logger.error(`Token revocation error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Token revocation failed');
    }
  }
}
