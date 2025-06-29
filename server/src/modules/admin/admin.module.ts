import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditLogController } from './audit-log.controller';
import { RevenueController } from './revenue.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { CommonModule } from '../../common/common.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [CommonModule, AuditModule],
  controllers: [AdminController, AuditLogController, RevenueController],
  providers: [
    AdminService,
    Reflector,
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AdminModule {}
