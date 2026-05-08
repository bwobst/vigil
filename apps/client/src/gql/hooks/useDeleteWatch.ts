import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "../../lib/graphql-client";
import { DeleteWatchDocument } from "../generated/graphql";

export function useDeleteWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gqlClient.request(DeleteWatchDocument, { id }),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["watches"] });
      queryClient.removeQueries({ queryKey: ["watch", id] });
    },
  });
}
