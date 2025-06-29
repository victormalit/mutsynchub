import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MpesaController } from './controllers/mpesa.controller';
import { MpesaService } from './services/mpesa.service';
import { PaymentSecurityService } from './services/payment-security.service';
import { PaymentMonitoringService } from './services/payment-monitoring.service';
import { PaymentMonitoringTasks } from './tasks/payment-monitoring.tasks';
import mpesaConfig from './config/mpesa.config';
import { CommonModule } from '../../common/common.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [
    ConfigModule.forFeature(mpesaConfig),
    ScheduleModule.forRoot(),
    AuditModule,
    CommonModule,
  ],
  controllers: [MpesaController],
  providers: [
    MpesaService,
    PaymentSecurityService,
    PaymentMonitoringService,
    PaymentMonitoringTasks,
  ],
  exports: [MpesaService, PaymentSecurityService, PaymentMonitoringService],
})
export class PaymentsModule {}
