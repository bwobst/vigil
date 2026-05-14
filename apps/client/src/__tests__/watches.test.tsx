import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { routeTree } from "../routeTree.gen";
import * as useWatchesModule from "../api/watches";
import * as useWatchRunsModule from "../api/watchRuns";
import * as sessionModule from "../api/session";
import { ThemeProvider } from "../components/ThemeProvider";

vi.mock("../api/watches");
vi.mock("../api/watchRuns");
vi.mock("../api/session");

function renderApp(initialPath = "/watches") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe("Watches list page", () => {
  beforeEach(() => {
    vi.mocked(sessionModule.useSession).mockReturnValue({
      data: { email: "user@example.com" },
      isPending: false,
      isError: false,
    } as any);
    vi.mocked(sessionModule.useSignOut).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as any);
  });

  it("shows loading state", async () => {
    vi.mocked(useWatchesModule.useWatches).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/loading watches/i)).toBeInTheDocument();
    });
  });

  it("shows error state", async () => {
    vi.mocked(useWatchesModule.useWatches).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/failed to load watches/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when no watches", async () => {
    vi.mocked(useWatchesModule.useWatches).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/no watches yet/i)).toBeInTheDocument();
    });
  });

  it("renders watch cards with name and URL", async () => {
    vi.mocked(useWatchesModule.useWatches).mockReturnValue({
      data: [
        {
          id: "1",
          name: "My Watch",
          targetUrl: "https://example.com",
          scheduleExpression: "*/5 * * * *",
          responseType: "HTML",
          extractorExpression: "h1",
          conditionOperator: "CHANGED",
          expectedValue: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
      isLoading: false,
      isError: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText("My Watch")).toBeInTheDocument();
      expect(screen.getByText("https://example.com")).toBeInTheDocument();
    });
  });

  it("shows latest run status badge when run data available", async () => {
    vi.mocked(useWatchesModule.useWatches).mockReturnValue({
      data: [
        {
          id: "1",
          name: "My Watch",
          targetUrl: "https://example.com",
          scheduleExpression: "*/5 * * * *",
          responseType: "HTML",
          extractorExpression: "h1",
          conditionOperator: "CHANGED",
          expectedValue: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: {
        runs: [
          {
            id: "r1",
            watchId: "1",
            startedAt: "2024-01-01T00:00:00Z",
            completedAt: "2024-01-01T00:00:05Z",
            status: "PASS",
            extractedValue: "foo",
            conditionMet: true,
            error: null,
          },
        ],
        totalCount: 1,
      },
      isLoading: false,
      isError: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText("PASS")).toBeInTheDocument();
    });
  });

  it("shows 'Never run' badge when no runs", async () => {
    vi.mocked(useWatchesModule.useWatches).mockReturnValue({
      data: [
        {
          id: "1",
          name: "My Watch",
          targetUrl: "https://example.com",
          scheduleExpression: "*/5 * * * *",
          responseType: "HTML",
          extractorExpression: "h1",
          conditionOperator: "CHANGED",
          expectedValue: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
      isLoading: false,
      isError: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText("Never run")).toBeInTheDocument();
    });
  });

  it("shows Watches nav link", async () => {
    vi.mocked(useWatchesModule.useWatches).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Watches" })).toBeInTheDocument();
    });
  });
});
