import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { routeTree } from "../routeTree.gen";
import * as useWatchModule from "../gql/hooks/useWatch";
import * as useWatchRunsModule from "../gql/hooks/useWatchRuns";
import * as useRunWatchModule from "../gql/hooks/useRunWatch";

vi.mock("../gql/hooks/useWatch");
vi.mock("../gql/hooks/useWatchRuns");
vi.mock("../gql/hooks/useRunWatch");

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
    status: "FAIL" as const,
    extractedValue: "Old Value",
    conditionMet: false,
    error: null,
  },
];

function renderApp(id = "1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/watches/${id}`] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("Watch detail page", () => {
  beforeEach(() => {
    vi.mocked(useRunWatchModule.useRunWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it("shows loading state while watch is fetching", async () => {
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
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
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: null },
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
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { watchRuns: [] },
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
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { watchRuns: mockRuns },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText("PASS")).toBeInTheDocument();
      expect(screen.getByText("FAIL")).toBeInTheDocument();
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });
  });

  it("shows empty state when no runs", async () => {
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { watchRuns: [] },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/no runs yet/i)).toBeInTheDocument();
    });
  });

  it("shows loading state in run history section", async () => {
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
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
    vi.mocked(useRunWatchModule.useRunWatch).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { watchRuns: [] },
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
    vi.mocked(useRunWatchModule.useRunWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { watchRuns: [] },
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
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: {
        watch: { ...mockWatch, conditionOperator: "EQUALS", expectedValue: "42" },
      },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { watchRuns: [] },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByText("Expected value")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  it("shows back link to watches list", async () => {
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { watchRuns: [] },
      isLoading: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /← watches/i })).toBeInTheDocument();
    });
  });
});
