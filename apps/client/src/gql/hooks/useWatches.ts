import { useQuery } from "@tanstack/react-query";
import { gqlClient } from "../../lib/graphql-client";
import { WatchesDocument } from "../generated/graphql";

export function useWatches() {
  return useQuery({
    queryKey: ["watches"],
    queryFn: () => gqlClient.request(WatchesDocument),
  });
}
