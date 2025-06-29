import { Logger, Module } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [
    ApiKeyService,
    ApiKeyGuard,
    {
      provide: Logger,
      useValue: new Logger(ApiKeyGuard.name)
    }
  ],
  exports: [ApiKeyGuard, ApiKeyService]
})
export class ApiKeyModule {}