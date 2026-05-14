import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchJson } from "./client";

export interface SessionUser {
  email: string;
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => apiFetch<SessionUser>("/api/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiFetchJson<void>("/api/auth/sign-in", "POST", data),
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/api/auth/sign-out", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
