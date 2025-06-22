import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MpesaController } from './controllers/mpesa.controller';
import { MpesaService } from './services/mpesa.service';
import { PaymentSecurityService } from './services/payment-security.service';
import { PaymentMonitoringService } from './services/payment-monitoring.service';
import { PaymentMonitoringTasks } from './tasks/payment-monitoring.tasks';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import mpesaConfig from './config/mpesa.config';

@Module({
  imports: [
    ConfigModule.forFeature(mpesaConfig),
    ScheduleModule.forRoot(),
  ],
  controllers: [MpesaController],
  providers: [
    MpesaService,
    PaymentSecurityService,
    PaymentMonitoringService,
    PaymentMonitoringTasks,
    PrismaService,
  ],
  exports: [MpesaService, PaymentSecurityService, PaymentMonitoringService],
})
export class PaymentsModule {}
