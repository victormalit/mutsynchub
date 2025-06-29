import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import moment from 'moment';

@Injectable()
export class PaymentMonitoringService {
  private readonly logger = new Logger(PaymentMonitoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async monitorPendingPayments(): Promise<void> {
    try {
      const staleTimeout = moment()
        .subtract(15, 'minutes')
        .toDate();

      // Find stale pending payments
      const stalePayments = await this.prisma.payment.findMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: staleTimeout,
          },
          retryCount: {
            lt: this.configService.get('mpesa.maxRetries'),
          },
        },
      });

      for (const payment of stalePayments) {
        this.logger.warn(`Found stale payment: ${payment.id}`, {
          paymentId: payment.id,
          amount: payment.amount,
          createdAt: payment.createdAt,
        });

        // Update status to failed for stale payments
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            errorMessage: 'Payment timeout - no confirmation received',
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.error('Error monitoring pending payments', error);
    }
  }

  async generateDailyReconciliationReport(): Promise<void> {
    try {
      const yesterday = moment().subtract(1, 'day').startOf('day');
      const today = moment().startOf('day');

      const payments = await this.prisma.payment.findMany({
        where: {
          createdAt: {
            gte: yesterday.toDate(),
            lt: today.toDate(),
          },
        },
      });

      const summary = {
        totalTransactions: payments.length,
        successfulTransactions: payments.filter(p => p.status === 'COMPLETED').length,
        failedTransactions: payments.filter(p => p.status === 'FAILED').length,
        totalAmount: payments
          .filter(p => p.status === 'COMPLETED')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        date: yesterday.format('YYYY-MM-DD'),
      };

      this.logger.log('Daily reconciliation report', summary);

      // Save reconciliation report
      await this.prisma.paymentReconciliation.create({
        data: {
          date: yesterday.toDate(),
          totalTransactions: summary.totalTransactions,
          successfulTransactions: summary.successfulTransactions,
          failedTransactions: summary.failedTransactions,
          totalAmount: summary.totalAmount,
          metadata: summary,
          organization: null, /* TODO: provide organization value here, e.g. organizationId or object */
        },
      });
    } catch (error) {
      this.logger.error('Error generating reconciliation report', error);
    }
  }
}
