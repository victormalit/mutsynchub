import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MpesaConfigValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(value: any) {
    const requiredConfigs = [
      'MPESA_CONSUMER_KEY',
      'MPESA_CONSUMER_SECRET',
      'MPESA_PASSKEY',
      'MPESA_SHORTCODE',
      'MPESA_CALLBACK_URL',
      'MPESA_VALIDATION_URL',
      'MPESA_CONFIRMATION_URL',
    ];

    const missingConfigs = requiredConfigs.filter(
      (config) => !this.configService.get(config),
    );

    if (missingConfigs.length > 0) {
      throw new BadRequestException(
        `Missing required M-Pesa configurations: ${missingConfigs.join(', ')}`,
      );
    }

    return value;
  }
}
