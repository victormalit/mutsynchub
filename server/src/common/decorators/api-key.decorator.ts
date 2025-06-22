import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';

export function RequireApiKey(scopes: string[] = []) {
  return applyDecorators(
    SetMetadata('scopes', scopes),
    UseGuards(ApiKeyGuard)
  );
}