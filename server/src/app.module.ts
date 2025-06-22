import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DataGateway } from './interfaces/websocket/data.gateway';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WebsocketModule } from './interfaces/websocket/websocket.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    // Database
    PrismaModule,
    // Core modules
    AuthModule,
    UserModule,
    AnalyticsModule,
    ApiKeyModule,
    PaymentsModule,
    // WebSocket modules
    EventEmitterModule.forRoot(),
    WebsocketModule,
    // Admin module (RBAC, audit logs, revenue, etc.)
    AdminModule,
  ],
  providers: [
    DataGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
  ],
  exports: [DataGateway],
})
export class AppModule {}
