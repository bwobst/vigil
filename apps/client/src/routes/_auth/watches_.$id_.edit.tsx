import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useWatch, useUpdateWatch } from "@/api/watches";
import { WatchForm, type WatchFormValues } from "@/components/WatchForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/watches_/$id_/edit")({
  component: EditWatchPage,
});

function EditWatchPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: watch, isLoading, isError } = useWatch(id);
  const updateWatch = useUpdateWatch();
  const [serverError, setServerError] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading watch…</p>;
  }

  if (isError || !watch) {
    return <p className="text-destructive">Watch not found.</p>;
  }

  async function handleSubmit(values: WatchFormValues) {
    setServerError(null);
    try {
      await updateWatch.mutateAsync({
        id,
        input: {
          name: values.name,
          targetUrl: values.targetUrl,
          responseType: values.responseType,
          extractorExpression: values.extractorExpression,
          conditionOperator: values.conditionOperator,
          expectedValue: values.conditionOperator !== "CHANGED" ? values.expectedValue : null,
          scheduleExpression: values.scheduleExpression,
          notifyEmail: values.notifyEmail,
        },
      });
      void navigate({ to: "/watches/$id", params: { id }, search: { runsPage: 1 } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update watch";
      setServerError(message);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link
          to="/watches/$id"
          params={{ id }}
          search={{ runsPage: 1 }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {watch.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Edit Watch</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Watch details</CardTitle>
        </CardHeader>
        <CardContent>
          <WatchForm
            defaultValues={{
              name: watch.name,
              targetUrl: watch.targetUrl,
              responseType: watch.responseType,
              extractorExpression: watch.extractorExpression,
              conditionOperator: watch.conditionOperator,
              expectedValue: watch.expectedValue ?? "",
              scheduleExpression: watch.scheduleExpression,
              notifyEmail: watch.notifyEmail,
            }}
            onSubmit={handleSubmit}
            onCancel={() => void navigate({ to: "/watches/$id", params: { id }, search: { runsPage: 1 } })}
            submitLabel="Save changes"
            isPending={updateWatch.isPending}
            serverError={serverError}
            notificationsReady={watch.notificationsReady}
          />
        </CardContent>
      </Card>
    </div>
  );
}
