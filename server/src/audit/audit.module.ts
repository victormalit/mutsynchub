import { Module } from '@nestjs/common';
import { AuditLoggerService } from './audit-logger.service';
import { PrismaModule } from '../infrastructure/persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditLoggerService],
  exports: [AuditLoggerService],
})
export class AuditModule {}
