import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "../../lib/graphql-client";
import { UpdateWatchDocument, type UpdateWatchMutationVariables } from "../generated/graphql";

export function useUpdateWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: UpdateWatchMutationVariables) =>
      gqlClient.request(UpdateWatchDocument, variables),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["watches"] });
      void queryClient.invalidateQueries({ queryKey: ["watch", variables.id] });
    },
  });
}
