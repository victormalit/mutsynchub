import { IsString, IsObject, IsOptional, IsEnum } from 'class-validator';

export enum IndustryType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  SUPERMARKET = 'supermarket',
  GENERAL = 'general'
}

export enum AnalysisType {
  AUTOMATED_EDA = 'automated_eda',
  FORECASTING = 'forecasting',
  FULL_ANALYSIS = 'full_analysis'
}

export class AnalysisRequestDto {
  @IsString()
  datasetId: string;

  @IsEnum(IndustryType)
  industryType: IndustryType;

  @IsEnum(AnalysisType)
  analysisType: AnalysisType;

  @IsObject()
  @IsOptional()
  parameters?: {
    timeColumn?: string;
    targetColumns?: string[];
    forecastPeriod?: number;
  };

  @IsOptional()
  @IsObject()
  customConfig?: Record<string, any>;
}
