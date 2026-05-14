import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useChangePassword } from "@/api/session";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/change-password")({
  component: ChangePasswordPage,
});

function validatePasswordPolicy(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 12) errors.push("At least 12 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("At least one digit");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("At least one symbol");
  return errors;
}

function ChangePasswordPage() {
  const changePassword = useChangePassword();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [policyErrors, setPolicyErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPolicyErrors([]);

    if (newPw !== confirmPw) {
      setError("New passwords do not match.");
      return;
    }

    const violations = validatePasswordPolicy(newPw);
    if (violations.length > 0) {
      setPolicyErrors(violations);
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: newPw });
      setSuccess(true);
      setCurrent("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Current password is incorrect.");
        } else if (err.status === 422) {
          setError("New password does not meet policy requirements.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-sm text-muted-foreground" role="status">
              Your password has been updated successfully. Other sessions have been signed out.
            </p>
          ) : (
            <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  required
                />
              </div>
              {policyErrors.length > 0 && (
                <ul className="text-sm text-destructive space-y-1 list-disc list-inside" role="alert">
                  {policyErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Updating…" : "Change password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
