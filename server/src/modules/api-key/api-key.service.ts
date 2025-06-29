import { Injectable, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createApiKey(orgId: string, data: {
    name: string;
    scopes: string[];
    expiresAt?: Date;
  }) {
    try {
      const key = this.generateApiKey();
      
      const apiKey = await this.prisma.apiKey.create({
        data: {
          key,
          name: data.name,
          scopes: data.scopes,
          expiresAt: data.expiresAt,
          orgId,
          status: 'ACTIVE',
        },
        include: {
          organization: true,
        },
      });

      this.logger.log(`API key created: orgId=${orgId}, keyId=${apiKey.id}, name=${data.name}`);
      
      // Remove sensitive data before returning
      const { key: _, ...safeApiKey } = apiKey;
      return {
        ...safeApiKey,
        key, // Include the key only on creation
      };
    } catch (error) {
      this.logger.error(`Failed to create API key: orgId=${orgId}, error=${(error as any).message}`, (error as any).stack);
      throw error;
    }
  }

  async validateApiKey(key: string, requestId?: string) {
    try {
      const apiKey = await this.prisma.apiKey.findUnique({
        where: { key },
        include: {
          organization: true,
        },
      });

      if (!apiKey) {
        this.logger.warn(`Invalid API key attempt: requestId=${requestId}`);
        throw new UnauthorizedException('Invalid API key');
      }

      if (apiKey.status !== 'ACTIVE') {
        this.logger.warn(`Inactive API key used: keyId=${apiKey.id}, requestId=${requestId}`);
        throw new UnauthorizedException('API key is not active');
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        this.logger.warn(`Expired API key used: keyId=${apiKey.id}, requestId=${requestId}`);
        throw new UnauthorizedException('API key has expired');
      }

      // Update last used timestamp
      await this.prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { 
          lastUsedAt: new Date(),
          useCount: {
            increment: 1
          }
        },
      });

      this.logger.debug(`API key validated: keyId=${apiKey.id}, orgId=${apiKey.orgId}, requestId=${requestId}`);

      return {
        orgId: apiKey.orgId,
        scopes: apiKey.scopes,
        organization: apiKey.organization,
        keyId: apiKey.id,
      };
    } catch (error) {
      this.logger.error(
        `API key validation failed: requestId=${requestId}, error=${(error as any).message}`,
        (error as any).stack
      );
      throw error;
    }
  }

  async revokeApiKey(id: string, orgId: string) {
    try {
      const apiKey = await this.prisma.apiKey.findFirst({
        where: { 
          id,
          orgId // Ensure key belongs to organization
        }
      });

      if (!apiKey) {
        throw new NotFoundException('API key not found');
      }

      const updated = await this.prisma.apiKey.update({
        where: { id },
        data: { 
          status: 'REVOKED',
          revokedAt: new Date()
        },
      });

      this.logger.log(`API key revoked: keyId=${id}, orgId=${orgId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to revoke API key: keyId=${id}, error=${(error as any).message}`, (error as any).stack);
      throw error;
    }
  }

  async listApiKeys(orgId: string, includeRevoked = false) {
    try {
      const where = {
        orgId,
        ...(includeRevoked ? {} : { status: 'ACTIVE' as const })
      };

      const apiKeys = await this.prisma.apiKey.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
          scopes: true,
          createdAt: true,
          expiresAt: true,
          lastUsedAt: true,
          useCount: true,
          revokedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return apiKeys;
    } catch (error) {
      this.logger.error(`Failed to list API keys: orgId=${orgId}, error=${(error as any).message}`, (error as any).stack);
      throw error;
    }
  }

  private generateApiKey(): string {
    // Generate a random 32-byte hex string with prefix
    return `mk_${randomBytes(32).toString('hex')}`;
  }
}
