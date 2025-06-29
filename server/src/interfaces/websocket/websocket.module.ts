import { Module } from '@nestjs/common';
import { DataGateway } from './data.gateway';
import { ConnectionStateService } from './connection-state.service';

@Module({
  providers: [DataGateway, ConnectionStateService],
  exports: [DataGateway, ConnectionStateService],
})
export class WebsocketModule {}
