import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { AuditLoggerService } from '../../../audit/audit-logger.service';
import axios from 'axios';
import moment from 'moment';
import {
  MpesaConfig,
  STKPushRequest,
  STKPushResponse,
  MpesaAuthResponse,
  MpesaCallbackPayload,
} from '../interfaces/mpesa.interface';
import { MpesaValidationRequest } from '../dto/mpesa-register-url.dto';
import { MpesaC2BConfirmation, MpesaC2BError } from '../interfaces/mpesa-c2b.interface';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly config: MpesaConfig;
  private accessToken: string;
  private tokenExpiry: Date;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
  ) {
    this.config = {
      consumerKey: this.configService.get<string>('MPESA_CONSUMER_KEY'),
      consumerSecret: this.configService.get<string>('MPESA_CONSUMER_SECRET'),
      passkey: this.configService.get<string>('MPESA_PASSKEY'),
      shortcode: this.configService.get<string>('MPESA_SHORTCODE'),
      environment: this.configService.get<'sandbox' | 'production'>('MPESA_ENVIRONMENT', 'sandbox'),
    };
  }

  private get baseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  private async generateToken(): Promise<string> {
    try {
      if (this.accessToken && this.tokenExpiry && moment().isBefore(this.tokenExpiry)) {
        return this.accessToken;
      }

      const auth = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`,
      ).toString('base64');

      const response = await axios.get<MpesaAuthResponse>(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = moment().add(58, 'minutes').toDate(); // Token expires in 1 hour

      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to generate M-Pesa access token', error);
      throw new Error('Failed to generate M-Pesa access token');
    }
  }

  private generatePassword(timestamp: string): string {
    const password = Buffer.from(
      `${this.config.shortcode}${this.config.passkey}${timestamp}`,
    ).toString('base64');
    return password;
  }

  // Tier pricing constants
  private static readonly TIER_PRICING = {
    STARTER: 2000,
    BUSINESS: 5000,
    CORPORATE: 15000,
  };

  private getTierByAmount(amount: number): 'STARTER' | 'BUSINESS' | 'CORPORATE' | null {
    if (amount === MpesaService.TIER_PRICING.STARTER) return 'STARTER';
    if (amount === MpesaService.TIER_PRICING.BUSINESS) return 'BUSINESS';
    if (amount === MpesaService.TIER_PRICING.CORPORATE) return 'CORPORATE';
    return null;
  }

  private async validateRequestAmount(amount: number): Promise<void> {
    if (!Object.values(MpesaService.TIER_PRICING).includes(amount)) {
      throw new Error('Invalid payment amount. Please select a valid subscription tier.');
    }
  }

  private async validatePhoneNumber(phoneNumber: string): Promise<string> {
    // Remove + and ensure number starts with 254
    const cleaned = phoneNumber.replace('+', '');
    if (!/^254\d{9}$/.test(cleaned)) {
      throw new Error('Invalid phone number format. Must be in format +254XXXXXXXXX');
    }
    return cleaned;
  }

  private async handleSTKError(error: any): Promise<never> {
    if (isAxiosError(error)) {
      const response = error.response?.data;
      if (response?.errorCode) {
        this.logger.error(`M-Pesa STK error: ${response.errorCode} - ${response.errorMessage}`);
        throw new Error(response.errorMessage || 'Failed to process M-Pesa payment');
      }
    }
    this.logger.error('Failed to initiate STK push', error);
    throw new Error('Failed to initiate M-Pesa payment');
  }

  async initiateSTKPush(
    userId: string,
    request: STKPushRequest,
  ): Promise<STKPushResponse> {
    try {
      await this.validateRequestAmount(request.amount);
      const validatedPhone = await this.validatePhoneNumber(request.phoneNumber);
      
      const token = await this.generateToken();
      const timestamp = moment().format('YYYYMMDDHHmmss');
      const password = this.generatePassword(timestamp);

      const response = await axios.post<STKPushResponse>(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.config.shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: request.amount,
          PartyA: request.phoneNumber,
          PartyB: this.config.shortcode,
          PhoneNumber: request.phoneNumber,
          CallBackURL: `${this.configService.get<string>('API_URL')}/payments/mpesa/callback`,
          AccountReference: request.accountReference,
          TransactionDesc: request.transactionDesc,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Determine tier
      const tier = this.getTierByAmount(request.amount);
      if (!tier) {
        throw new Error('Invalid payment amount. Please select a valid subscription tier.');
      }

      // Find the user's organization
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.orgId) {
        throw new Error('User or user organization not found');
      }

      // Create payment record

      await this.prisma.payment.create({
        data: {
          user: { connect: { id: userId } },
          organization: { connect: { id: user.orgId } },
          amount: request.amount,
          provider: 'MPESA',
          status: 'PENDING',
          phoneNumber: request.phoneNumber,
          checkoutRequestId: response.data.CheckoutRequestID,
          merchantRequestId: response.data.MerchantRequestID,
          metadata: {
            accountReference: request.accountReference,
            transactionDesc: request.transactionDesc,
            tier,
          },
        },
      });

      // Audit log for payment initiation
      await this.auditLogger.log({
        userId,
        orgId: user.orgId,
        action: 'PAYMENT_INITIATED',
        resource: 'PAYMENT',
        details: {
          provider: 'MPESA',
          amount: request.amount,
          tier,
          phoneNumber: request.phoneNumber,
          checkoutRequestId: response.data.CheckoutRequestID,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to initiate STK push', error);
      throw new Error('Failed to initiate M-Pesa payment');
    }
  }

  async handleCallback(payload: MpesaCallbackPayload) {
    const { stkCallback } = payload.Body;
    
    try {
      // Create callback record
      await this.prisma.mpesaCallback.create({
        data: {
          checkoutRequestId: stkCallback.CheckoutRequestID,
          merchantRequestId: stkCallback.MerchantRequestID,
          resultCode: stkCallback.ResultCode.toString(),
          resultDesc: stkCallback.ResultDesc,
          amount: this.extractAmount(stkCallback),
          mpesaReceiptNumber: this.extractMpesaReceiptNumber(stkCallback),
          phoneNumber: this.extractPhoneNumber(stkCallback),
          transactionDate: new Date(),
        },
      });

      // Audit log for callback
      await this.auditLogger.log({
        userId: undefined, // Not always available
        action: 'PAYMENT_CALLBACK',
        resource: 'PAYMENT',
        details: {
          checkoutRequestId: stkCallback.CheckoutRequestID,
          resultCode: stkCallback.ResultCode,
          resultDesc: stkCallback.ResultDesc,
        },
      });

      // Update payment record and organization tier if payment is successful
      if (stkCallback.ResultCode === 0) {
        // Find the payment record
        const payment = await this.prisma.payment.findFirst({
          where: {
            checkoutRequestId: stkCallback.CheckoutRequestID,
            status: 'PENDING',
          },
        });
        let tier: 'STARTER' | 'BUSINESS' | 'CORPORATE' | null = null;
        if (payment) {
          tier = this.getTierByAmount(Number(payment.amount));
        }

        await this.prisma.payment.updateMany({
          where: {
            checkoutRequestId: stkCallback.CheckoutRequestID,
            status: 'PENDING',
          },
          data: {
            status: 'COMPLETED',
            mpesaReceiptNumber: this.extractMpesaReceiptNumber(stkCallback),
            updatedAt: new Date(),
          },
        });

        // Audit log for payment completion
        await this.auditLogger.log({
          userId: payment?.userId,
          orgId: payment?.orgId,
          action: 'PAYMENT_COMPLETED',
          resource: 'PAYMENT',
          details: {
            checkoutRequestId: stkCallback.CheckoutRequestID,
            mpesaReceiptNumber: this.extractMpesaReceiptNumber(stkCallback),
            amount: payment?.amount,
            tier,
          },
        });

        // Upgrade organization tier if payment is valid
        if (payment && tier) {
          // Find the user's organization
          const user = await this.prisma.user.findUnique({ where: { id: payment.userId } });
          if (user && user.orgId) {
            await this.prisma.subscription.update({
              where: { orgId: user.orgId },
              data: {
                plan: tier,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: null,
              },
            });
          }
        }
      } else {
        await this.prisma.payment.updateMany({
          where: {
            checkoutRequestId: stkCallback.CheckoutRequestID,
            status: 'PENDING',
          },
          data: {
            status: 'FAILED',
            errorMessage: stkCallback.ResultDesc,
            updatedAt: new Date(),
          },
        });

        // Audit log for payment failure
        await this.auditLogger.log({
          userId: undefined,
          action: 'PAYMENT_FAILED',
          resource: 'PAYMENT',
          details: {
            checkoutRequestId: stkCallback.CheckoutRequestID,
            resultDesc: stkCallback.ResultDesc,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to process M-Pesa callback', error);
      throw new Error('Failed to process M-Pesa callback');
    }
  }

  private extractAmount(callback: MpesaCallbackPayload['Body']['stkCallback']): number {
    return Number(
      callback.CallbackMetadata?.Item.find((item) => item.Name === 'Amount')
        ?.Value || 0,
    );
  }

  private extractMpesaReceiptNumber(
    callback: MpesaCallbackPayload['Body']['stkCallback'],
  ): string {
    return String(
      callback.CallbackMetadata?.Item.find(
        (item) => item.Name === 'MpesaReceiptNumber',
      )?.Value || '',
    );
  }

  private extractPhoneNumber(
    callback: MpesaCallbackPayload['Body']['stkCallback'],
  ): string {
    return String(
      callback.CallbackMetadata?.Item.find((item) => item.Name === 'PhoneNumber')
        ?.Value || '',
    );
  }

  async retryFailedPayment(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.status !== 'FAILED' || payment.retryCount >= 3) {
      throw new Error('Payment cannot be retried');
    }

    try {
      const response = await this.initiateSTKPush(payment.userId, {
        amount: Number(payment.amount),
        phoneNumber: payment.phoneNumber,
        accountReference: (payment.metadata as { accountReference: string; transactionDesc: string }).accountReference,
        transactionDesc: (payment.metadata as { accountReference: string; transactionDesc: string }).transactionDesc,
      });

      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PENDING',
          checkoutRequestId: response.CheckoutRequestID,
          merchantRequestId: response.MerchantRequestID,
          retryCount: { increment: 1 },
          errorMessage: null,
          updatedAt: new Date(),
        },
      });

      // Audit log for payment retry
      await this.auditLogger.log({
        userId: payment.userId,
        orgId: payment.orgId,
        action: 'PAYMENT_RETRY',
        resource: 'PAYMENT',
        details: {
          paymentId,
          amount: payment.amount,
          phoneNumber: payment.phoneNumber,
          retryCount: payment.retryCount + 1,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to retry payment ${paymentId}`, error);
      throw new Error('Failed to retry payment');
    }
  }

  async registerC2BUrl(): Promise<void> {
    try {
      const token = await this.generateToken();
      const validationUrl = this.configService.get<string>('MPESA_VALIDATION_URL');
      const confirmationUrl = this.configService.get<string>('MPESA_CONFIRMATION_URL');

      interface RegisterUrlResponse {
        ConversationID: string;
        OriginatorCoversationID: string;
        ResponseCode: string;
        ResponseDescription: string;
      }

      const response = await axios.post<RegisterUrlResponse>(
        `${this.baseUrl}/mpesa/c2b/v1/registerurl`,
        {
          ShortCode: this.config.shortcode,
          ResponseType: 'Completed',
          ConfirmationURL: confirmationUrl,
          ValidationURL: validationUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.ResponseCode !== '0') {
        throw new Error(response.data.ResponseDescription);
      }

      this.logger.log('Successfully registered C2B URLs');
    } catch (error) {
      this.logger.error('Failed to register C2B URLs', error);
      throw new Error('Failed to register M-Pesa C2B URLs');
    }
  }

  async validateC2BPayment(payload: MpesaValidationRequest): Promise<void> {
    try {
      // Validate amount and other business rules
      const amount = Number(payload.TransAmount);
      if (amount < 1) {
        throw new Error('Invalid amount');
      }

      // Create pending payment record
      await this.prisma.payment.create({
        data: {
          // user and organization are required, so we use dummy values or null if allowed, or skip for now
          // Replace 'null' with actual user and organization connection if available
          amount,
          provider: 'MPESA',
          status: 'PENDING',
          phoneNumber: payload.MSISDN,
          metadata: {
            BillRefNumber: payload.BillRefNumber,
            TransactionType: payload.TransactionType,
            InvoiceNumber: payload.InvoiceNumber,
          },
          // Provide dummy or placeholder relations if allowed by your schema
          user: undefined,
          organization: undefined,
        },
      });
    } catch (error) {
      this.logger.error('C2B validation failed', error);
      throw new Error('C2B validation failed');
    }
  }

  async confirmC2BPayment(payload: any): Promise<void> {
    try {
      const { TransID, TransAmount, MSISDN, BillRefNumber } = payload;

      // Find and update the pending payment
      await this.prisma.payment.updateMany({
        where: {
          phoneNumber: MSISDN,
          status: 'PENDING',
        },
        data: {
          status: 'COMPLETED',
          mpesaReceiptNumber: TransID,
          updatedAt: new Date(),
        },
      });

      // Audit log for C2B payment confirmation
      await this.auditLogger.log({
        userId: undefined,
        action: 'C2B_PAYMENT_CONFIRMED',
        resource: 'PAYMENT',
        details: {
          TransID,
          TransAmount,
          MSISDN,
          BillRefNumber,
        },
      });

      this.logger.log(`C2B payment confirmed: ${TransID}`);
    } catch (error) {
      this.logger.error('Failed to confirm C2B payment', error);
      throw new Error('C2B confirmation failed');
    }
  }

  private handleError(error: any, operation: string): never {
    const errorResponse: MpesaC2BError = {
      error: {
        code: 'MPESA_ERROR',
        message: `Failed to ${operation}`
      },
      timestamp: new Date().toISOString()
    };

    if (isAxiosError(error)) {
      errorResponse.error.code = error.response?.status?.toString() || 'NETWORK_ERROR';
      errorResponse.error.message = error.response?.data?.errorMessage || error.message;
    }

    this.logger.error(`M-Pesa error: ${operation}`, {
      error: errorResponse,
      originalError: error
    });

    throw errorResponse;
  }

  private async recordTransactionError(transactionId: string, error: MpesaC2BError): Promise<void> {
    try {
      await this.prisma.payment.updateMany({
        where: {
          checkoutRequestId: transactionId,
          status: 'PENDING'
        },
        data: {
          status: 'FAILED',
          errorMessage: error.error.message,
          metadata: {
            errorCode: error.error.code,
            errorTimestamp: error.timestamp
          }
        }
      });
    } catch (dbError) {
      this.logger.error('Failed to record transaction error', dbError);
    }
  }
}
function isAxiosError(error: any): boolean {
  return isAxiosError(error);
}

