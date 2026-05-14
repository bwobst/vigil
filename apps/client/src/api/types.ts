export interface WatchRun {
  id: string;
  watchId: string;
  startedAt: string;
  completedAt: string;
  status: RunStatus;
  extractedValue?: string | null;
  conditionMet?: boolean | null;
  error?: string | null;
}

export type ResponseType = "HTML" | "JSON";

export type ConditionOperator = "EQUALS" | "CHANGED" | "LESS_THAN" | "GREATER_THAN";

export type RunStatus = "PASS" | "ERROR";

export interface Watch {
  id: string;
  name: string;
  targetUrl: string;
  responseType: ResponseType;
  extractorExpression: string;
  conditionOperator: ConditionOperator;
  expectedValue?: string | null;
  scheduleExpression: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWatchInput {
  name: string;
  targetUrl: string;
  responseType: ResponseType;
  extractorExpression: string;
  conditionOperator: ConditionOperator;
  expectedValue?: string | null;
  scheduleExpression: string;
}

export interface UpdateWatchInput {
  name?: string;
  targetUrl?: string;
  responseType?: ResponseType;
  extractorExpression?: string;
  conditionOperator?: ConditionOperator;
  expectedValue?: string | null;
  scheduleExpression?: string;
}
