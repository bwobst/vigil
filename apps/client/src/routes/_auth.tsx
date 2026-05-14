import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/api/session";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { isPending, isError } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isError) {
      void navigate({ to: "/sign-in" });
    }
  }, [isError, navigate]);

  if (isPending) {
    return <p className="text-muted-foreground py-8 text-center">Loading…</p>;
  }

  if (isError) {
    return null;
  }

  return <Outlet />;
}
