import { Prisma } from '@prisma/client';
import { AuditLoggerService } from '../../../../audit/audit-logger.service';

export class AuditPrismaMiddleware {
  constructor(private readonly auditLogger: AuditLoggerService) {}

  handle: Prisma.Middleware = async (params, next) => {
    const result = await next(params);
    // Example: log all create/update/delete actions
    if (['create', 'update', 'delete'].includes(params.action)) {
      await this.auditLogger.log({
        userId: 'system', // Replace with actual user context if available
        action: params.action,
        resource: params.model || 'unknown',
        details: params.args,
      });
    }
    return result;
  };
}
