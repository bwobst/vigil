import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "../../lib/graphql-client";
import { RunWatchDocument } from "../generated/graphql";

export function useRunWatch(watchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gqlClient.request(RunWatchDocument, { watchId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["watch-runs", watchId] });
    },
  });
}
