import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchJson } from "./client";
import type { AccountNotificationSettings } from "./types";

export function useAccountNotifications() {
  return useQuery({
    queryKey: ["account", "notifications"],
    queryFn: () => apiFetch<AccountNotificationSettings>("/api/account/notifications"),
  });
}

export function useUpdateAccountNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { phone?: string | null }) =>
      apiFetchJson<AccountNotificationSettings>("/api/account/notifications", "PATCH", data),
    onSuccess: (data) => {
      queryClient.setQueryData(["account", "notifications"], data);
    },
  });
}

export function useRefreshNotificationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetchJson<AccountNotificationSettings>("/api/account/notifications/refresh", "POST", {}),
    onSuccess: (data) => {
      queryClient.setQueryData(["account", "notifications"], data);
    },
  });
}
