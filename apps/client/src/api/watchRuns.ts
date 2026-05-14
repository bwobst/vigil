import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { WatchRun } from "./types";

export function useWatchRuns(watchId: string) {
  return useQuery({
    queryKey: ["watch-runs", watchId],
    queryFn: () => apiFetch<WatchRun[]>(`/api/watches/${watchId}/runs`),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}
