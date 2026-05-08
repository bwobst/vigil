import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateWatch } from "@/api/watches";
import { WatchForm, type WatchFormValues } from "@/components/WatchForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/watches_/new")({
  component: CreateWatchPage,
});

function CreateWatchPage() {
  const navigate = useNavigate();
  const createWatch = useCreateWatch();
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(values: WatchFormValues) {
    setServerError(null);
    try {
      const watch = await createWatch.mutateAsync({
        name: values.name,
        targetUrl: values.targetUrl,
        responseType: values.responseType,
        extractorExpression: values.extractorExpression,
        conditionOperator: values.conditionOperator,
        expectedValue: values.conditionOperator === "EQUALS" ? values.expectedValue : null,
        scheduleExpression: values.scheduleExpression,
      });
      void navigate({ to: "/watches/$id", params: { id: watch.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create watch";
      setServerError(message);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link to="/watches" className="text-sm text-muted-foreground hover:text-foreground">
          ← Watches
        </Link>
      </div>

      <h1 className="text-2xl font-bold">New Watch</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Watch details</CardTitle>
        </CardHeader>
        <CardContent>
          <WatchForm
            onSubmit={handleSubmit}
            onCancel={() => void navigate({ to: "/watches" })}
            submitLabel="Create Watch"
            isPending={createWatch.isPending}
            serverError={serverError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
