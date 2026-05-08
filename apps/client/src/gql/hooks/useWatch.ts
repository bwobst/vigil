import { useQuery } from "@tanstack/react-query";
import { gqlClient } from "../../lib/graphql-client";
import { WatchDocument } from "../generated/graphql";

export function useWatch(id: string) {
  return useQuery({
    queryKey: ["watch", id],
    queryFn: () => gqlClient.request(WatchDocument, { id }),
  });
}
