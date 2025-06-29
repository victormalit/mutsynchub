import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CommonModule } from '../../common/common.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [CommonModule, AuditModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
