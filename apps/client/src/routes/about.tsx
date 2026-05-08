import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  component: AboutComponent,
});

function AboutComponent() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">About</CardTitle>
        <CardDescription>This app is built with:</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>Vite — build tool and dev server</li>
          <li>React 19 — UI framework</li>
          <li>TypeScript — type safety</li>
          <li>Tailwind CSS — utility-first CSS</li>
          <li>shadcn/ui — component library</li>
          <li>TanStack Router — type-safe routing</li>
          <li>Biome — linting and formatting</li>
          <li>Vitest — testing framework</li>
        </ul>
      </CardContent>
    </Card>
  );
}
