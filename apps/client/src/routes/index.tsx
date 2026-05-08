import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to Vigil</CardTitle>
        <CardDescription>
          A React app built with Vite, TypeScript, Tailwind CSS, and TanStack
          Router.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Navigate to the About page to see routing in action.
        </p>
      </CardContent>
    </Card>
  );
}
