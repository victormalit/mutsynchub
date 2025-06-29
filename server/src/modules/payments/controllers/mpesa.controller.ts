import { Controller, Post, Body, Param, UseGuards, HttpStatus, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { MpesaService } from '../services/mpesa.service';
import { PaymentSecurityService } from '../services/payment-security.service';
import { SecurePaymentGuard } from '../guards/secure-payment.guard';
import { SecurePaymentInterceptor } from '../interceptors/secure-payment.interceptor';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { STKPushRequest, MpesaCallbackPayload } from '../interfaces/mpesa.interface';
import { MpesaValidationRequest } from '../dto/mpesa-register-url.dto';
import { MpesaConfigValidationPipe } from '../pipes/mpesa-config-validation.pipe';

@ApiTags('payments')
@Controller('payments/mpesa')
@UseGuards(JwtAuthGuard, SecurePaymentGuard)
@UseInterceptors(SecurePaymentInterceptor)
@UsePipes(MpesaConfigValidationPipe)
export class MpesaController {
  constructor(
    private readonly mpesaService: MpesaService,
    private readonly securityService: PaymentSecurityService
  ) {}

  @Post('stk-push')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate M-Pesa STK Push payment' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment initiated successfully' })
  async initiateSTKPush(
    @CurrentUser('id') userId: string,
    @Body() request: STKPushRequest,
  ) {
    return this.mpesaService.initiateSTKPush(userId, request);
  }

  @Post('callback')
  @ApiOperation({ summary: 'Handle M-Pesa payment callback' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Callback processed successfully' })
  async handleCallback(@Body() payload: MpesaCallbackPayload) {
    await this.mpesaService.handleCallback(payload);
    return { success: true };
  }

  @Post(':paymentId/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry failed M-Pesa payment' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment retry initiated successfully' })
  async retryPayment(
    @Param('paymentId') paymentId: string,
  ) {
    await this.mpesaService.retryFailedPayment(paymentId);
    return { success: true };
  }

  @Post('register-urls')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register C2B URLs with M-Pesa' })
  @ApiResponse({ status: HttpStatus.OK, description: 'URLs registered successfully' })
  async registerUrls() {
    await this.mpesaService.registerC2BUrl();
    return { success: true };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Handle M-Pesa C2B validation request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment validated' })
  async validatePayment(@Body() payload: MpesaValidationRequest) {
    await this.mpesaService.validateC2BPayment(payload);
    return {
      ResultCode: '0',
      ResultDesc: 'Success',
    };
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Handle M-Pesa C2B confirmation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment confirmed' })
  async confirmPayment(@Body() payload: any) {
    await this.mpesaService.confirmC2BPayment(payload);
    return {
      ResultCode: '0',
      ResultDesc: 'Success',
    };
  }
}
