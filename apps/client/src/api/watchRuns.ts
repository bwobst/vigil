import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { WatchRunsPage } from "./types";

export const RUNS_PAGE_SIZE = 20;

export function useWatchRuns(watchId: string, page = 1) {
  return useQuery({
    queryKey: ["watch-runs", watchId, page],
    queryFn: () =>
      apiFetch<WatchRunsPage>(`/api/watches/${watchId}/runs?page=${page}`),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}
