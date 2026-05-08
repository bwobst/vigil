import { useQuery } from "@tanstack/react-query";
import { gqlClient } from "../../lib/graphql-client";
import { WatchRunsDocument } from "../generated/graphql";

export function useWatchRuns(watchId: string) {
  return useQuery({
    queryKey: ["watch-runs", watchId],
    queryFn: () => gqlClient.request(WatchRunsDocument, { watchId }),
  });
}
