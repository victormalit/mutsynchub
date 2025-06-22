import { IsNotEmpty, IsNumber, IsString, IsPhoneNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class STKPushDto {
  @ApiProperty({
    description: 'Amount to be paid',
    example: 1000,
    minimum: 1
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Customer phone number (format: +254XXXXXXXXX)',
    example: '+254712345678'
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('KE')
  phoneNumber: string;

  @ApiProperty({
    description: 'Account reference for the transaction',
    example: 'INV-2025-001'
  })
  @IsNotEmpty()
  @IsString()
  accountReference: string;

  @ApiProperty({
    description: 'Description of the transaction',
    example: 'Premium subscription payment'
  })
  @IsNotEmpty()
  @IsString()
  transactionDesc: string;
}
