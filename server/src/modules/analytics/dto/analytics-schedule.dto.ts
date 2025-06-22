import { IsString, IsOptional, IsInt, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ description: 'Frequency of analytics runs (hourly, daily, weekly, monthly, custom)' })
  @IsString()
  frequency: string;

  @ApiProperty({ description: 'Interval in minutes (required for custom frequency)', required: false })
  @IsOptional()
  @IsInt()
  interval?: number;
}

export class UpdateScheduleDto {
  @ApiProperty({ description: 'Frequency of analytics runs', required: false })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiProperty({ description: 'Interval in minutes', required: false })
  @IsOptional()
  @IsInt()
  interval?: number;
}
