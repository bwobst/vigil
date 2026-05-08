import { createFileRoute } from "@tanstack/react-router";
import { useWatches, useWatchRuns } from "@/gql/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WatchesQuery } from "@/gql/generated/graphql";

type Watch = WatchesQuery["watches"][number];

export const Route = createFileRoute("/watches")({
  component: WatchListPage,
});

function WatchListPage() {
  const { data, isLoading, isError } = useWatches();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading watches…</p>;
  }

  if (isError) {
    return <p className="text-destructive">Failed to load watches.</p>;
  }

  const watches = data?.watches ?? [];

  if (watches.length === 0) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>No watches yet</CardTitle>
          <CardDescription>
            Create a watch to start monitoring URLs.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Watches</h1>
      <div className="space-y-3">
        {watches.map((watch) => (
          <WatchCard key={watch.id} watch={watch} />
        ))}
      </div>
    </div>
  );
}

function WatchCard({ watch }: { watch: Watch }) {
  const { data } = useWatchRuns(watch.id);
  const latestRun = data?.watchRuns[0] ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{watch.name}</CardTitle>
        <CardDescription>{watch.targetUrl}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm">
          <RunStatusBadge status={latestRun?.status ?? null} />
          {latestRun?.extractedValue != null && (
            <span className="text-muted-foreground">
              Value: {latestRun.extractedValue}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RunStatusBadge({ status }: { status: string | null }) {
  if (status === null) {
    return <span className="text-muted-foreground">Never run</span>;
  }

  const colorClass =
    status === "PASS"
      ? "text-emerald-600"
      : status === "FAIL"
        ? "text-red-600"
        : "text-orange-600";

  return <span className={colorClass}>{status}</span>;
}
