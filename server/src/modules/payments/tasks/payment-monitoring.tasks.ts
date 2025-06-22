import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentMonitoringService } from '../services/payment-monitoring.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class PaymentMonitoringTasks {
  private readonly logger = new Logger(PaymentMonitoringTasks.name);

  constructor(
    private readonly monitoringService: PaymentMonitoringService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleStalePendingPayments() {
    try {
      await this.monitoringService.monitorPendingPayments();
    } catch (error) {
      this.logger.error('Failed to handle stale payments', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyReport() {
    try {
      await this.monitoringService.generateDailyReconciliationReport();
    } catch (error) {
      this.logger.error('Failed to generate daily reconciliation report', error);
    }
  }
}
