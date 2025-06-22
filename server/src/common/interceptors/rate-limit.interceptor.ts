import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  TooManyRequestsException,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// In-memory store for demo; use Redis or similar for distributed environments
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const requestCounts: Record<string, { count: number; windowStart: number }> = {};

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!requestCounts[ip] || now - requestCounts[ip].windowStart > RATE_LIMIT_WINDOW_MS) {
      requestCounts[ip] = { count: 1, windowStart: now };
    } else {
      requestCounts[ip].count += 1;
    }

    if (requestCounts[ip].count > MAX_REQUESTS_PER_WINDOW) {
      this.logger.warn(`Rate limit exceeded for IP: ${ip}`);
      throw new TooManyRequestsException('Too many requests, please try again later.');
    }

    return next.handle().pipe(
      tap(() => {
        // Optionally log successful requests
      })
    );
  }
}
