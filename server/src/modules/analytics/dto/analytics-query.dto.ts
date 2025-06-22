import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiProperty({ description: 'Natural language query for analytics' })
  @IsString()
  query: string;

  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ description: 'Specific dataset ID to query', required: false })
  @IsOptional()
  @IsUUID()
  datasetId?: string;

  @ApiProperty({ description: 'Type of analysis required', required: false })
  @IsOptional()
  @IsString()
  analysisType?: string;
}
