import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditLoggerService } from '../../../../common/services/audit-logger.service';

export class ErrorHandlingMiddleware {
  constructor(
    private readonly logger: Logger,
    private readonly auditLogger: AuditLoggerService
  ) {}

  handle = async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>,
    userContext?: { userId?: string; orgId?: string; ipAddress?: string; userAgent?: string }
  ) => {
    try {
      return await next(params);
    } catch (error) {
      // Prepare error context
      const errorContext = {
        model: params.model,
        action: params.action,
        args: params.args,
        timestamp: new Date().toISOString(),
        ...userContext,
      };

      let errorMessage = '';
      let errorStack = '';
      if (typeof error === 'object' && error && 'message' in error) {
        errorMessage = (error as any).message;
        errorStack = (error as any).stack;
      } else {
        errorMessage = String(error);
        errorStack = '';
      }

      // Enhanced error logging based on error type
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error('Database operation failed - Known error', {
          ...errorContext,
          code: (error as any).code,
          error: errorMessage,
          target: (error as any).meta?.target
        });
        if ((error as any).meta) {
          (error as any).meta = { ...(error as any).meta, ...errorContext };
        }
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        this.logger.error('Database operation failed - Validation error', {
          ...errorContext,
          error: errorMessage
        });
      } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        this.logger.error('Database operation failed - Unknown error', {
          ...errorContext,
          error: errorMessage
        });
      } else {
        this.logger.error('Database operation failed - Unexpected error', {
          ...errorContext,
          error: errorMessage,
          stack: errorStack
        });
      }

      // Audit log for DB errors (compliance)
      if (this.auditLogger) {
        await this.auditLogger.log({
          userId: userContext?.userId || 'system',
          orgId: userContext?.orgId,
          action: 'db_error',
          resource: params.model || 'unknown',
          details: {
            errorType: error?.constructor?.name,
            errorMessage,
            errorStack,
            prismaAction: params.action,
            prismaArgs: params.args,
            ...errorContext,
          },
          ipAddress: userContext?.ipAddress,
          userAgent: userContext?.userAgent,
        });
      }
      throw error;
    }
  };
}

