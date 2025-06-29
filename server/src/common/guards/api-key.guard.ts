import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException, 
  Logger, 
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ApiKeyGuard implements CanActivate {

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const requestId = request.headers['x-request-id'] || 'unknown';

    if (!apiKey) {
      this.logger.warn(`API key missing: requestId=${requestId}, ip=${request.ip}`);
      throw new UnauthorizedException('API key is required');
    }

    try {
      // Validate API key using Prisma directly
      const validatedKey = await this.prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { organization: true }
      });

      if (!validatedKey) {
        this.logger.warn(`Invalid API key: requestId=${requestId}, ip=${request.ip}`);
        throw new UnauthorizedException('Invalid API key');
      }

      if (validatedKey.status !== 'ACTIVE') {
        this.logger.warn(`Inactive API key: requestId=${requestId}, keyId=${validatedKey.id}`);
        throw new UnauthorizedException('API key is not active');
      }

      if (validatedKey.expiresAt && validatedKey.expiresAt < new Date()) {
        this.logger.warn(`Expired API key: requestId=${requestId}, keyId=${validatedKey.id}`);
        throw new UnauthorizedException('API key has expired');
      }

      // Enforce tenant isolation
      const headerTenantId = request.headers['x-tenant-id'];
      if (headerTenantId && validatedKey.organization?.subdomain !== headerTenantId) {
        this.logger.warn(
          `Tenant isolation violation: requestId=${requestId}, ` +
          `apiKeyOrg=${validatedKey.organization?.subdomain}, headerTenant=${headerTenantId}`
        );
        throw new UnauthorizedException('Tenant mismatch');
      }

      // Attach organization info to request
      request.organization = validatedKey.organization;
      request.orgId = validatedKey.orgId;
      request.apiKeyScopes = validatedKey.scopes;
      request.apiKeyId = validatedKey.id;

      // Check required scopes
      const requiredScopes = this.getRequiredScopes(context);
      if (requiredScopes?.length > 0) {
        const hasScope = requiredScopes.every(scope => 
          validatedKey.scopes?.includes(scope)
        );
        if (!hasScope) {
          this.logger.warn(
            `Insufficient scope: requestId=${requestId}, ` +
            `required=${requiredScopes}, actual=${validatedKey.scopes}`
          );
          throw new ForbiddenException('Insufficient API key scope');
        }
      }

      // Update last used timestamp
      await this.prisma.apiKey.update({
        where: { id: validatedKey.id },
        data: { lastUsedAt: new Date() }
      });

      // Audit log successful access
      this.logger.log(
        `API key access granted: requestId=${requestId}, ` +
        `org=${validatedKey.organization?.subdomain}, ` +
        `orgId=${validatedKey.orgId}, ` +
        `keyId=${validatedKey.id}, ` +
        `ip=${request.ip}`
      );

      return true;

    } catch (error) {
      // Log detailed error information
      this.logger.error(
        `API key validation failed: requestId=${requestId}, ` +
        `ip=${request.ip}, error=${(error as any).message}`,
        (error as any).stack
      );

      // Rethrow authentication errors, wrap others
      if (error instanceof UnauthorizedException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('API key validation failed');
    }
  }

  private getRequiredScopes(context: ExecutionContext): string[] {
    return this.reflector.get<string[]>('scopes', context.getHandler()) || [];
  }
}
