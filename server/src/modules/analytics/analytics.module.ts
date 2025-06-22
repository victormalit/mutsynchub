import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsScheduleService } from './analytics-schedule.service';
import { DataSourceModule } from '../data-source/data-source.module';
import { DataGateway } from '../../interfaces/websocket/data.gateway';
import { AutomatedAnalysisService } from './services/automated-analysis.service';
import { DataCleaningService } from './services/data-cleaning.service';
import { AnalyticsCacheService } from './services/analytics-cache.service';
import { WebsocketModule } from '../../interfaces/websocket/websocket.module';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MLModule } from '../../infrastructure/ml/ml.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DataSourceModule,
    PrismaModule,
    WebsocketModule,
    MLModule,
  ],
  providers: [
    AnalyticsService,
    AnalyticsScheduleService,
    AutomatedAnalysisService,
    DataCleaningService,
    AnalyticsCacheService,
    DataGateway,
  ],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, AnalyticsScheduleService],
})
export class AnalyticsModule {}
