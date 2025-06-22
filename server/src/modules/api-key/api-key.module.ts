import { Logger, Module } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Module({
  imports: [PrismaModule],
  providers: [
    ApiKeyService,  // Added ApiKeyService to providers
    ApiKeyGuard,
    {
      provide: Logger,
      useValue: new Logger(ApiKeyGuard.name)
    }
  ],
  exports: [ApiKeyGuard, ApiKeyService]  // Added ApiKeyService to exports
})
export class ApiKeyModule {}