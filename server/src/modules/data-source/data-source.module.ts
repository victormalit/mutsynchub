import { Module } from '@nestjs/common';
import { DataSourceService } from './data-source.service';
import { DataSourceController } from './data-source.controller';
import { DataGateway } from '../../interfaces/websocket/data.gateway';

@Module({
  controllers: [DataSourceController],
  providers: [DataSourceService, DataGateway],
  exports: [DataSourceService],
})
export class DataSourceModule {}
