import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/persistence/prisma/prisma.module';

@Module({
  imports: [forwardRef(() => PrismaModule)],
})
export class CommonModule {}
