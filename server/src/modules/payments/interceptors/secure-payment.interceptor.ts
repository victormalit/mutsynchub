import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaymentSecurityService } from '../services/payment-security.service';

@Injectable()
export class SecurePaymentInterceptor implements NestInterceptor {
  constructor(private readonly securityService: PaymentSecurityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Decrypt incoming payment data if encrypted
    if (request.body?.encryptedPayload) {
      request.body = this.securityService.decryptPayload(request.body.encryptedPayload);
    }

    return next.handle().pipe(
      map(data => {
        // Don't encrypt webhook responses
        if (request.url.includes('/callback')) {
          return data;
        }

        // Encrypt sensitive payment data in response
        return {
          encryptedPayload: this.securityService.encryptPayload(data)
        };
      }),
    );
  }
}
