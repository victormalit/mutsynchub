import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import { AuditLoggerService } from '../../common/services/audit-logger.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    orgId: string;
    role?: UserRole;
    userId?: string; // The admin or system user creating this user
    ipAddress?: string;
    userAgent?: string;
  }) {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        ...data,
        role: data.role || UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    // Audit log user creation
    await this.auditLogger.log({
      userId: data.userId || user.id,
      orgId: data.orgId,
      action: 'user_create',
      resource: 'user',
      details: {
        createdUserId: user.id,
        email: user.email,
        role: user.role,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return user;
  }

  async update(id: string, data: {
    firstName?: string;
    lastName?: string;
    status?: UserStatus;
    role?: UserRole;
    userId?: string;
    orgId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    // Audit log user update
    await this.auditLogger.log({
      userId: data.userId || id,
      orgId: data.orgId,
      action: 'user_update',
      resource: 'user',
      details: {
        updatedUserId: id,
        changes: data,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return updated;
  }

  async delete(id: string, context?: { userId?: string; orgId?: string; ipAddress?: string; userAgent?: string }) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deleted = await this.prisma.user.delete({ where: { id } });

    // Audit log user deletion
    await this.auditLogger.log({
      userId: context?.userId || id,
      orgId: context?.orgId,
      action: 'user_delete',
      resource: 'user',
      details: {
        deletedUserId: id,
        email: user.email,
        role: user.role,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return deleted;
  }
}
