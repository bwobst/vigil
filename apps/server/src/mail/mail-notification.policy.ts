export type EdgeType = "CONDITION_MET" | "EXECUTION_ERROR";

export interface RunSnapshot {
  status: string;
  conditionMet: boolean | null;
}

/**
 * Determines whether a watch run represents a notification trigger edge.
 *
 * Returns EXECUTION_ERROR when the run failed and the prior run (if any) did not.
 * Returns CONDITION_MET when conditionMet became true and it was not true in the prior run.
 * Returns null when no edge is detected (steady state or no qualifying change).
 *
 * Both edges are mutually exclusive in practice: ERROR runs have null conditionMet,
 * and PASS runs with conditionMet=true are never ERROR.
 */
export function detectNotificationEdge(
  current: RunSnapshot,
  prior: RunSnapshot | null,
): EdgeType | null {
  if (current.status === "ERROR" && (prior === null || prior.status !== "ERROR")) {
    return "EXECUTION_ERROR";
  }
  if (current.conditionMet === true && (prior === null || prior.conditionMet !== true)) {
    return "CONDITION_MET";
  }
  return null;
}
