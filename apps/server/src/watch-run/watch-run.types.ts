import { registerEnumType } from "@nestjs/graphql";

export enum RunStatus {
  PASS = "PASS",
  FAIL = "FAIL",
  ERROR = "ERROR",
}

registerEnumType(RunStatus, { name: "RunStatus" });
