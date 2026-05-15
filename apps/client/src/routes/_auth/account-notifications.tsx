import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAccountNotifications, useUpdateAccountNotifications, useRefreshNotificationStatus } from "@/api/account";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/account-notifications")({
  component: AccountNotificationsPage,
});

function EmailSubscriptionStatus({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-sm text-muted-foreground">Not subscribed</span>;
  }
  if (status === "Confirmed") {
    return <span className="text-sm text-green-600 dark:text-green-400">Confirmed</span>;
  }
  return (
    <span className="text-sm text-amber-600 dark:text-amber-400">
      Pending — check your inbox and confirm the AWS notification email
    </span>
  );
}

function AccountNotificationsPage() {
  const { data, isPending, isError } = useAccountNotifications();
  const updateSettings = useUpdateAccountNotifications();
  const refreshStatus = useRefreshNotificationStatus();

  const [phone, setPhone] = useState<string>("");
  const [phoneInitialized, setPhoneInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (data && !phoneInitialized) {
    setPhone(data.phone ?? "");
    setPhoneInitialized(true);
  }

  if (isPending) {
    return <p className="text-muted-foreground py-8 text-center">Loading…</p>;
  }

  if (isError || !data) {
    return <p className="text-destructive py-8 text-center">Failed to load notification settings.</p>;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const phoneValue = phone.trim() || null;

    try {
      await updateSettings.mutateAsync({ phone: phoneValue });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError("Phone number must be in E.164 format (e.g. +15551234567).");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  async function handleRefresh() {
    setError(null);
    setSuccess(false);
    try {
      await refreshStatus.mutateAsync();
    } catch {
      setError("Failed to refresh subscription status.");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Notification settings</CardTitle>
          <CardDescription>Configure how Vigil delivers Watch alerts to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Email alerts</Label>
            <p className="text-sm text-muted-foreground">{data.email}</p>
            <div className="flex items-center gap-3">
              <EmailSubscriptionStatus status={data.emailSubscriptionStatus} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={refreshStatus.isPending}
                onClick={() => void handleRefresh()}
              >
                {refreshStatus.isPending ? "Checking…" : "Refresh status"}
              </Button>
            </div>
          </div>

          <form onSubmit={(e) => { void handleSave(e); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+15551234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">E.164 format. Used for SMS alerts in a future release.</p>
            </div>

            {success && (
              <p className="text-sm text-green-600 dark:text-green-400" role="status">
                Settings saved.
              </p>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Saving…" : "Save settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
