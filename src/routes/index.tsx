import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to Sandcastle
          </h1>
          <p className="mt-2 text-gray-600">
            This is a barebones React app built with Vite, TypeScript, Tailwind
            CSS, and TanStack Router.
          </p>
          <p className="mt-4 text-gray-600">
            Navigate to the About page to see routing in action.
          </p>
        </div>
      </div>
    </div>
  );
}
