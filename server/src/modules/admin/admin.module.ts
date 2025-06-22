import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditLogController } from './audit-log.controller';
import { RevenueController } from './revenue.controller';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { APP_GUARD, Reflector } from '@nestjs/core';

@Module({
  controllers: [AdminController, AuditLogController, RevenueController],
  providers: [
    AdminService,
    PrismaService,
    AuditLoggerService,
    Reflector,
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AdminModule {}
