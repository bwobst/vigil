export type ResponseType = "HTML" | "JSON";

export type ConditionOperator =
  | "EQUALS"
  | "CHANGED"
  | "LESS_THAN"
  | "GREATER_THAN";

export interface WatchInput {
  targetUrl: string;
  responseType: ResponseType;
  extractorExpression: string;
  conditionOperator: ConditionOperator;
  expectedValue: string | null;
}

export interface ExecutorResult {
  extractedValue: string | null;
  conditionMet: boolean | null;
  error: string | null;
}

export interface ExecuteOptions {
  previousExtractedValue?: string | null;
}
