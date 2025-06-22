import { IsString, IsObject, IsOptional, IsUUID } from 'class-validator';

export class JoinOrgDto {
  @IsUUID()
  orgId: string;
}

export class LeaveOrgDto {
  @IsUUID()
  orgId: string;
}

export class DataUpdateDto {
  @IsUUID()
  streamId: string;

  @IsObject()
  data: any;

  @IsString()
  @IsOptional()
  eventType?: string;

  @IsString()
  @IsOptional()
  correlationId?: string;
}

export class AnalyticsEventDto {
  @IsString()
  type: 'metric' | 'alert' | 'report';

  @IsUUID()
  orgId: string;

  @IsObject()
  payload: any;

  @IsString()
  @IsOptional()
  correlationId?: string;
}
