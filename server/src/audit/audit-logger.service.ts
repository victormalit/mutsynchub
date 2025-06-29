import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/persistence/prisma/prisma.service';

interface AuditLogDetails {
  [key: string]: any;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log({
    userId,
    action,
    resource,
    details = {},
    orgId,
    ipAddress,
    userAgent,
  }: {
    userId?: string; // Make optional
    action: string;
    resource: string;
    details?: AuditLogDetails;
    orgId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId && userId !== 'system' ? userId : null, // Set to null if not a real user
          action,
          resource,
          details,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.error('Failed to write audit log', error);
    }
  }

  async getAllLogs(query: any = {}) {
    const { userId, action, orgId, from, to } = query;
    return this.prisma.auditLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(action && { action }),
        ...(orgId && { orgId }),
        ...(from && to && { timestamp: { gte: new Date(from), lte: new Date(to) } }),
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }
}
