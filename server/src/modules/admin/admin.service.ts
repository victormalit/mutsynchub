import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { AuditLoggerService } from '../../common/services/audit-logger.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async setUserRole(userId: string, role: UserRole, context?: { adminId?: string; orgId?: string; ipAddress?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    // Audit log role change
    await this.auditLogger.log({
      userId: context?.adminId || 'admin',
      orgId: context?.orgId,
      action: 'admin_set_user_role',
      resource: 'user',
      details: {
        targetUserId: userId,
        newRole: role,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
    return updated;
  }

  async getAllOrganizations() {
    return this.prisma.organization.findMany();
  }

  async setOrganizationStatus(orgId: string, status: string, context?: { adminId?: string; ipAddress?: string; userAgent?: string }) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: { status },
    });
    // Audit log org status change
    await this.auditLogger.log({
      userId: context?.adminId || 'admin',
      orgId,
      action: 'admin_set_org_status',
      resource: 'organization',
      details: {
        newStatus: status,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
    return updated;
  }
}
