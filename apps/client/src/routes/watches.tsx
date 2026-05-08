import { createFileRoute, Link } from "@tanstack/react-router";
import { useWatches } from "@/api/watches";
import { useWatchRuns } from "@/api/watchRuns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RunStatus } from "@/api/types";

export const Route = createFileRoute("/watches")({
  component: WatchesPage,
});

function statusVariant(status: RunStatus) {
  if (status === "PASS") return "pass";
  if (status === "FAIL") return "fail";
  return "error";
}

function WatchCard({ id, name, targetUrl, scheduleExpression }: {
  id: string;
  name: string;
  targetUrl: string;
  scheduleExpression: string;
}) {
  const { data } = useWatchRuns(id);
  const latestRun = data?.[0];

  return (
    <Link to="/watches/$id" params={{ id }} className="block hover:no-underline">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{name}</CardTitle>
            {latestRun ? (
              <Badge variant={statusVariant(latestRun.status as RunStatus)}>
                {latestRun.status}
              </Badge>
            ) : (
              <Badge variant="outline">Never run</Badge>
            )}
          </div>
          <CardDescription className="truncate">{targetUrl}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Schedule: <code>{scheduleExpression}</code>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function WatchesPage() {
  const { data, isLoading, isError } = useWatches();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading watches…</p>;
  }

  if (isError) {
    return <p className="text-destructive">Failed to load watches.</p>;
  }

  const watches = data ?? [];

  if (watches.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Watches</h1>
          <Button asChild>
            <Link to="/watches/new">New Watch</Link>
          </Button>
        </div>
        <div className="text-center py-16">
          <p className="text-muted-foreground">No watches yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Watches</h1>
        <Button asChild>
          <Link to="/watches/new">New Watch</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {watches.map((w) => (
          <WatchCard
            key={w.id}
            id={w.id}
            name={w.name}
            targetUrl={w.targetUrl}
            scheduleExpression={w.scheduleExpression}
          />
        ))}
      </div>
    </div>
  );
}
