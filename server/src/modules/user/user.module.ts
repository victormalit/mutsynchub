import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { AuditLoggerService } from '../../common/services/audit-logger.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, AuditLoggerService],
  exports: [UserService],
})
export class UserModule {}
