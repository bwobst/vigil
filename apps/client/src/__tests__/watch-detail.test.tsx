import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { routeTree } from "../routeTree.gen";
import * as useWatchesModule from "../api/watches";
import * as useWatchRunsModule from "../api/watchRuns";
import * as sessionModule from "../api/session";
import { ThemeProvider } from "../components/ThemeProvider";

vi.mock("../api/watches");
vi.mock("../api/watchRuns");
vi.mock("../api/session");

const mockWatch = {
  id: "1",
  name: "Example Watch",
  targetUrl: "https://example.com",
  responseType: "HTML" as const,
  extractorExpression: "h1",
  conditionOperator: "CHANGED" as const,
  expectedValue: null,
  scheduleExpression: "*/5 * * * *",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const mockRuns = [
  {
    id: "r1",
    watchId: "1",
    startedAt: "2024-01-02T10:00:00Z",
    completedAt: "2024-01-02T10:00:05Z",
    status: "PASS" as const,
    extractedValue: "Hello World",
    conditionMet: true,
    error: null,
  },
  {
    id: "r2",
    watchId: "1",
    startedAt: "2024-01-01T10:00:00Z",
    completedAt: "2024-01-01T10:00:05Z",
    status: "PASS" as const,
    extractedValue: "Old Value",
    conditionMet: false,
    error: null,
  },
];

function renderApp(path = "/watches/1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe("Watch detail page", () => {
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
    vi.mocked(useWatchesModule.useRunWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it("shows loading state while watch is fetching", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/loading watch/i)).toBeInTheDocument();
    });
  });

  it("shows error state when watch not found", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/watch not found/i)).toBeInTheDocument();
    });
  });

  it("displays watch configuration", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: [], totalCount: 0 },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText("Example Watch")).toBeInTheDocument();
      expect(screen.getByText("https://example.com")).toBeInTheDocument();
      expect(screen.getByText("HTML")).toBeInTheDocument();
      expect(screen.getByText("h1")).toBeInTheDocument();
      expect(screen.getByText("CHANGED")).toBeInTheDocument();
      expect(screen.getByText("*/5 * * * *")).toBeInTheDocument();
    });
  });

  it("displays run history with status badges", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: mockRuns, totalCount: 2 },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getAllByText("PASS")).toHaveLength(2);
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });
  });

  it("shows empty state when no runs", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: [], totalCount: 0 },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/no runs yet/i)).toBeInTheDocument();
    });
  });

  it("shows loading state in run history section", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/loading runs/i)).toBeInTheDocument();
    });
  });

  it("calls runNow mutation when Run now button is clicked", async () => {
    const mutate = vi.fn();
    vi.mocked(useWatchesModule.useRunWatch).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: [], totalCount: 0 },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /run now/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /run now/i }));
    expect(mutate).toHaveBeenCalledOnce();
  });

  it("disables Run now button and shows loading text while running", async () => {
    vi.mocked(useWatchesModule.useRunWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: [], totalCount: 0 },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /running/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });
  });

  it("shows expected value when condition is EQUALS", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: { ...mockWatch, conditionOperator: "EQUALS", expectedValue: "42" },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: [], totalCount: 0 },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText("Expected value")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  it("shows back link to watches list", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: [], totalCount: 0 },
      isLoading: false,
      isError: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /← watches/i })).toBeInTheDocument();
    });
  });

  it("shows inline error when run history fetch fails with no prior data", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/failed to refresh run history/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/no runs yet/i)).not.toBeInTheDocument();
  });

  it("shows inline error and stale run list when run history fetch fails with prior data", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: mockRuns, totalCount: 2 },
      isLoading: false,
      isError: true,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/failed to refresh run history/i)).toBeInTheDocument();
      expect(screen.getAllByText("PASS")).toHaveLength(2);
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });
  });

  it("shows pagination controls when totalCount > 0", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: mockRuns, totalCount: 2 },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });
  });

  it("disables Previous button on first page", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: mockRuns, totalCount: 2 },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    });
  });

  it("does not show pagination when there are no runs", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: [], totalCount: 0 },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
    });
  });

  it("passes page from URL search param to useWatchRuns", async () => {
    vi.mocked(useWatchesModule.useWatch).mockReturnValue({
      data: mockWatch,
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { runs: mockRuns, totalCount: 40 },
      isLoading: false,
    } as any);

    renderApp("/watches/1?runsPage=2");
    await waitFor(() => {
      expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
    });
    expect(vi.mocked(useWatchRunsModule.useWatchRuns)).toHaveBeenCalledWith("1", 2);
  });
});
