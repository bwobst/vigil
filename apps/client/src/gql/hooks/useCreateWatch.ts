import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "../../lib/graphql-client";
import { CreateWatchDocument, type CreateWatchMutationVariables } from "../generated/graphql";

export function useCreateWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: CreateWatchMutationVariables) =>
      gqlClient.request(CreateWatchDocument, variables),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["watches"] });
    },
  });
}
