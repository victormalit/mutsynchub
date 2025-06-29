import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLoggerService } from '../../audit/audit-logger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogger: AuditLoggerService) {}

  @Get()
  @Roles('ADMIN')
  async getAuditLogs(@Query() query: any) {
    // Optionally add filters: userId, action, date range, etc.
    return this.auditLogger.getAllLogs(query);
  }
}
