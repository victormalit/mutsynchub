import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Logger } from '@nestjs/common';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly logger: Logger) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Get request first for access to headers
      const request = context.switchToHttp().getRequest();
      const headerTenantId = request.headers['x-tenant-id'];

      // Validate JWT first
      const isJwtValid = await super.canActivate(context);
      if (!isJwtValid) {
        this.logger.warn(`JWT validation failed: ip=${request.ip}`);
        return false;
      }

      // After JWT validation, user will be attached to request
      const user = request.user;

      // Check tenant isolation
      if (headerTenantId && user?.tenantId !== headerTenantId) {
        this.logger.warn(
          `Tenant isolation violation: user=${user?.id}, ` +
          `userTenant=${user?.tenantId}, headerTenant=${headerTenantId}, ` +
          `ip=${request.ip}`
        );
        throw new UnauthorizedException('Tenant mismatch');
      }

      this.logger.log(
        `JWT Auth success: user=${user?.id}, ` +
        `tenant=${user?.tenantId}, ip=${request.ip}`
      );
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException && error.message === 'Tenant mismatch') {
        // Re-throw tenant mismatch errors as-is
        throw error;
      }
      if (error instanceof TokenExpiredError) {
        this.logger.error(`JWT Auth error: ${error.message}`, error.stack);
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof JsonWebTokenError) {
        this.logger.error(`JWT Auth error: ${error.message}`, error.stack);
        throw new UnauthorizedException('Invalid token format');
      }
      this.logger.error(`JWT Auth error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}