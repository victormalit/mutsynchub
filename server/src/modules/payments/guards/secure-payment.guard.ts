import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PaymentSecurityService } from '../services/payment-security.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurePaymentGuard implements CanActivate {
  constructor(
    private readonly securityService: PaymentSecurityService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-payment-signature'];
    const timestamp = request.headers['x-payment-timestamp'];

    // Skip signature verification for callbacks from M-Pesa
    if (request.url.includes('/callback')) {
      return this.validateMpesaCallback(request);
    }

    if (!signature || !timestamp) {
      throw new UnauthorizedException('Missing payment security headers');
    }

    // Verify request is not too old (prevent replay attacks)
    const requestTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes

    if (currentTime - requestTime > timeWindow) {
      throw new UnauthorizedException('Request expired');
    }

    // Verify signature
    const payload = {
      ...request.body,
      timestamp,
    };

    if (!this.securityService.verifyPaymentSignature(payload, signature)) {
      throw new UnauthorizedException('Invalid payment signature');
    }

    return true;
  }

  private validateMpesaCallback(request: any): boolean {
    // Verify M-Pesa callback using their security requirements
    const mpesaPassword = this.configService.get<string>('MPESA_PASSKEY');
    const shortcode = this.configService.get<string>('MPESA_SHORTCODE');
    
    // Add M-Pesa specific validation logic here
    // This would typically involve validating their security credentials
    
    return true;
  }
}
