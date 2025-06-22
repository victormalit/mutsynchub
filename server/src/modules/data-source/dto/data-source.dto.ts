import { IsString, IsEnum, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DataSourceType, DataSourceStatus } from '@prisma/client';

export class CreateDataSourceDto {
  @ApiProperty({ example: 'Sales Data Feed' })
  @IsString()
  name: string;

  @ApiProperty({ enum: DataSourceType, example: 'API' })
  @IsEnum(DataSourceType)
  type: DataSourceType;

  @ApiProperty({ example: 'org123' })
  @IsString()
  orgId: string;

  @ApiProperty({
    example: {
      endpoint: 'https://api.example.com/sales',
      apiKey: 'xxx',
      interval: '5m'
    }
  })
  @IsObject()
  config: Record<string, any>;
}

export class UpdateDataSourceDto {
  @ApiProperty({ example: 'Updated Sales Feed' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: {
      endpoint: 'https://api.example.com/sales-v2'
    }
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiProperty({ enum: DataSourceStatus })
  @IsEnum(DataSourceStatus)
  @IsOptional()
  status?: DataSourceStatus;
}

export class CreateDataStreamDto {
  @ApiProperty({ example: 'Daily Sales Stream' })
  @IsString()
  name: string;

  @ApiProperty({
    example: {
      fields: {
        timestamp: 'datetime',
        amount: 'number',
        product_id: 'string'
      }
    }
  })
  @IsObject()
  schema: Record<string, any>;

  @ApiProperty({
    example: {
      aggregations: ['sum(amount)', 'count(*)'],
      filters: ['amount > 0']
    }
  })
  @IsObject()
  @IsOptional()
  transformations?: Record<string, any>;
}
