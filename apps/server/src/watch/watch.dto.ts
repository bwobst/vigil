import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from "class-validator";

export enum ResponseType {
  HTML = "HTML",
  JSON = "JSON",
}

export enum ConditionOperator {
  EQUALS = "EQUALS",
  CHANGED = "CHANGED",
  LESS_THAN = "LESS_THAN",
  GREATER_THAN = "GREATER_THAN",
}

export class CreateWatchDto {
  @IsString()
  name!: string;

  @IsUrl()
  targetUrl!: string;

  @IsEnum(ResponseType)
  responseType!: ResponseType;

  @IsString()
  extractorExpression!: string;

  @IsEnum(ConditionOperator)
  conditionOperator!: ConditionOperator;

  @IsOptional()
  @IsString()
  expectedValue?: string | null;

  @Matches(/^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/, {
    message: "scheduleExpression must be a valid cron expression",
  })
  scheduleExpression!: string;
}

export class UpdateWatchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  targetUrl?: string;

  @IsOptional()
  @IsEnum(ResponseType)
  responseType?: ResponseType;

  @IsOptional()
  @IsString()
  extractorExpression?: string;

  @IsOptional()
  @IsEnum(ConditionOperator)
  conditionOperator?: ConditionOperator;

  @IsOptional()
  @IsString()
  expectedValue?: string | null;

  @IsOptional()
  @Matches(/^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/, {
    message: "scheduleExpression must be a valid cron expression",
  })
  scheduleExpression?: string;
}
