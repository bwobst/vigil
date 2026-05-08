import { registerEnumType } from "@nestjs/graphql";

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

registerEnumType(ResponseType, { name: "ResponseType" });
registerEnumType(ConditionOperator, { name: "ConditionOperator" });
