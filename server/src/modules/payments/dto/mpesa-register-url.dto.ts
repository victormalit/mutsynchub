import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, IsNumberString } from 'class-validator';

export class MpesaRegisterUrlResponse {
  @ApiProperty({
    description: 'The status of the registration request',
    example: '0'
  })
  ResponseCode: string;

  @ApiProperty({
    description: 'Description of the registration status',
    example: 'Success'
  })
  ResponseDescription: string;
}

export class MpesaValidationRequest {
  @ApiProperty({
    description: 'The transaction type',
    example: 'CustomerPayBillOnline'
  })
  @IsNotEmpty()
  @IsString()
  TransactionType: string;

  @ApiProperty({
    description: 'The shortcode receiving the payment',
    example: '174379'
  })
  @IsNotEmpty()
  @IsNumberString()
  BusinessShortCode: string;

  @ApiProperty({ example: 'BILL PAYMENT' })
  @IsNotEmpty()
  @IsString()
  BillRefNumber: string;

  @ApiProperty({ example: '1000' })
  @IsNotEmpty()
  @IsNumberString()
  TransAmount: string;

  @ApiProperty({ example: '254712345678' })
  @IsNotEmpty()
  @Matches(/^254[0-9]{9}$/, {
    message: 'Phone number must be in the format 254XXXXXXXXX'
  })
  MSISDN: string;

  @ApiProperty({ example: 'INV-001' })
  @IsNotEmpty()
  @IsString()
  InvoiceNumber: string;
}

export class MpesaValidationResponse {
  @ApiProperty({
    description: 'The result code',
    example: '0'
  })
  ResultCode: string;

  @ApiProperty({
    description: 'The result description',
    example: 'Success'
  })
  ResultDesc: string;
}
