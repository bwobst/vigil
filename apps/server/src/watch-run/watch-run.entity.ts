import type { RunStatus } from "./watch-run.types";

export class WatchRun {
  id!: string;
  watchId!: string;
  startedAt!: Date;
  completedAt!: Date;
  status!: RunStatus;
  extractedValue?: string | null;
  conditionMet?: boolean | null;
  error?: string | null;
}
