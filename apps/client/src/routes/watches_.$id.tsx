import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useWatch } from "@/gql/hooks/useWatch";
import { useWatchRuns } from "@/gql/hooks/useWatchRuns";
import { useRunWatch } from "@/gql/hooks/useRunWatch";
import { useDeleteWatch } from "@/gql/hooks/useDeleteWatch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RunStatus } from "@/gql/generated/graphql";

export const Route = createFileRoute("/watches_/$id")({
  component: WatchDetailPage,
});

function statusVariant(status: RunStatus) {
  if (status === "PASS") return "pass";
  if (status === "FAIL") return "fail";
  return "error";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function WatchDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: watchData, isLoading: watchLoading, isError: watchError } = useWatch(id);
  const { data: runsData, isLoading: runsLoading } = useWatchRuns(id);
  const runNow = useRunWatch(id);
  const deleteWatch = useDeleteWatch();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (watchLoading) {
    return <p className="text-muted-foreground">Loading watch…</p>;
  }

  if (watchError || !watchData?.watch) {
    return <p className="text-destructive">Watch not found.</p>;
  }

  const watch = watchData.watch;
  const runs = runsData?.watchRuns ?? [];

  function handleDelete() {
    deleteWatch.mutate(id, {
      onSuccess: () => {
        void navigate({ to: "/watches" });
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/watches" className="text-sm text-muted-foreground hover:text-foreground">
          ← Watches
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{watch.name}</h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={() => runNow.mutate()}
            disabled={runNow.isPending}
          >
            {runNow.isPending ? "Running…" : "Run now"}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/watches/$id/edit" params={{ id }}>Edit</Link>
          </Button>
          {confirmDelete ? (
            <>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteWatch.isPending}
              >
                {deleteWatch.isPending ? "Deleting…" : "Confirm delete"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteWatch.isPending}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Target URL</dt>
              <dd className="mt-1 break-all">{watch.targetUrl}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Response type</dt>
              <dd className="mt-1">{watch.responseType}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Extractor</dt>
              <dd className="mt-1 font-mono">{watch.extractorExpression}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Condition</dt>
              <dd className="mt-1">{watch.conditionOperator}</dd>
            </div>
            {watch.expectedValue != null && (
              <div>
                <dt className="font-medium text-muted-foreground">Expected value</dt>
                <dd className="mt-1 font-mono">{watch.expectedValue}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-muted-foreground">Schedule</dt>
              <dd className="mt-1 font-mono">{watch.scheduleExpression}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run history</CardTitle>
        </CardHeader>
        <CardContent>
          {runsLoading ? (
            <p className="text-muted-foreground text-sm">Loading runs…</p>
          ) : runs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No runs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium">Started</th>
                    <th className="text-left pb-2 font-medium">Completed</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                    <th className="text-left pb-2 font-medium">Value</th>
                    <th className="text-left pb-2 font-medium">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatDate(run.startedAt)}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatDate(run.completedAt)}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={statusVariant(run.status)}>
                          {run.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 font-mono">
                        {run.extractedValue ?? "—"}
                      </td>
                      <td className="py-2">
                        {run.conditionMet == null
                          ? "—"
                          : run.conditionMet
                            ? "Yes"
                            : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
