import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutComponent,
});

function AboutComponent() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">About</h1>
          <p className="mt-2 text-gray-600">
            This app is built with the following technologies:
          </p>
          <ul className="mt-4 list-disc list-inside space-y-2 text-gray-600">
            <li>Vite - Build tool and dev server</li>
            <li>React 19 - UI framework</li>
            <li>TypeScript - Type safety</li>
            <li>Tailwind CSS - Utility-first CSS</li>
            <li>TanStack Router - Type-safe routing</li>
            <li>Biome - Linting and formatting</li>
            <li>Vitest - Testing framework</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
