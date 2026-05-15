import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchJson } from "./client";
import type { CreateWatchInput, UpdateWatchInput, Watch } from "./types";

export function useNotificationReadiness() {
  return useQuery({
    queryKey: ["notification-readiness"],
    queryFn: () => apiFetch<{ notificationsReady: boolean }>("/api/notifications/readiness"),
    staleTime: 60_000,
  });
}

export function useWatches() {
  return useQuery({
    queryKey: ["watches"],
    queryFn: () => apiFetch<Watch[]>("/api/watches"),
  });
}

export function useWatch(id: string) {
  return useQuery({
    queryKey: ["watch", id],
    queryFn: () => apiFetch<Watch>(`/api/watches/${id}`),
  });
}

export function useCreateWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWatchInput) =>
      apiFetchJson<Watch>("/api/watches", "POST", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["watches"] });
    },
  });
}

export function useUpdateWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWatchInput }) =>
      apiFetchJson<Watch>(`/api/watches/${id}`, "PATCH", input),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["watches"] });
      void queryClient.invalidateQueries({ queryKey: ["watch", id] });
    },
  });
}

export function useDeleteWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/watches/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["watches"] });
      queryClient.removeQueries({ queryKey: ["watch", id] });
    },
  });
}

export function useRunWatch(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/watches/${id}/run`, { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["watch-runs", id] });
    },
  });
}
