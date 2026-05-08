import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { routeTree } from "../routeTree.gen";

vi.mock("../gql/hooks", () => ({
  useWatches: vi.fn(),
  useWatchRuns: vi.fn(),
  useWatch: vi.fn(),
  useCreateWatch: vi.fn(),
  useUpdateWatch: vi.fn(),
  useDeleteWatch: vi.fn(),
  useRunWatch: vi.fn(),
}));

import { useWatches, useWatchRuns } from "../gql/hooks";

const mockUseWatches = vi.mocked(useWatches);
const mockUseWatchRuns = vi.mocked(useWatchRuns);

function renderWatchesPage() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/watches"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("Watch list page", () => {
  it("shows loading state while fetching", async () => {
    mockUseWatches.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);
    mockUseWatchRuns.mockReturnValue({ data: undefined } as any);

    renderWatchesPage();

    await waitFor(() => {
      expect(screen.getByText("Loading watches…")).toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    mockUseWatches.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);
    mockUseWatchRuns.mockReturnValue({ data: undefined } as any);

    renderWatchesPage();

    await waitFor(() => {
      expect(screen.getByText("Failed to load watches.")).toBeInTheDocument();
    });
  });

  it("shows empty state when no watches exist", async () => {
    mockUseWatches.mockReturnValue({
      data: { watches: [] },
      isLoading: false,
      isError: false,
    } as any);
    mockUseWatchRuns.mockReturnValue({ data: undefined } as any);

    renderWatchesPage();

    await waitFor(() => {
      expect(screen.getByText("No watches yet")).toBeInTheDocument();
    });
  });

  it("displays watches with name and target URL", async () => {
    mockUseWatches.mockReturnValue({
      data: {
        watches: [
          {
            id: "1",
            name: "My Watch",
            targetUrl: "https://example.com",
            responseType: "HTML",
            extractorExpression: "h1",
            conditionOperator: "EQUALS",
            expectedValue: "Hello",
            scheduleExpression: "*/5 * * * *",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as any);
    mockUseWatchRuns.mockReturnValue({ data: undefined } as any);

    renderWatchesPage();

    await waitFor(() => {
      expect(screen.getByText("My Watch")).toBeInTheDocument();
      expect(screen.getByText("https://example.com")).toBeInTheDocument();
    });
  });

  it("shows 'Never run' when a watch has no runs", async () => {
    mockUseWatches.mockReturnValue({
      data: {
        watches: [
          {
            id: "1",
            name: "My Watch",
            targetUrl: "https://example.com",
            responseType: "HTML",
            extractorExpression: "h1",
            conditionOperator: "EQUALS",
            expectedValue: null,
            scheduleExpression: "*/5 * * * *",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as any);
    mockUseWatchRuns.mockReturnValue({ data: { watchRuns: [] } } as any);

    renderWatchesPage();

    await waitFor(() => {
      expect(screen.getByText("Never run")).toBeInTheDocument();
    });
  });

  it("shows latest run status and extracted value", async () => {
    mockUseWatches.mockReturnValue({
      data: {
        watches: [
          {
            id: "1",
            name: "Price Watch",
            targetUrl: "https://shop.example.com",
            responseType: "HTML",
            extractorExpression: ".price",
            conditionOperator: "CHANGED",
            expectedValue: null,
            scheduleExpression: "0 * * * *",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as any);
    mockUseWatchRuns.mockReturnValue({
      data: {
        watchRuns: [
          {
            id: "r1",
            watchId: "1",
            startedAt: "2026-01-02T00:00:00Z",
            completedAt: "2026-01-02T00:00:01Z",
            status: "PASS",
            extractedValue: "$9.99",
            conditionMet: true,
            error: null,
          },
        ],
      },
    } as any);

    renderWatchesPage();

    await waitFor(() => {
      expect(screen.getByText("PASS")).toBeInTheDocument();
      expect(screen.getByText("Value: $9.99")).toBeInTheDocument();
    });
  });

  it("shows navigation link for Watches", async () => {
    mockUseWatches.mockReturnValue({
      data: { watches: [] },
      isLoading: false,
      isError: false,
    } as any);
    mockUseWatchRuns.mockReturnValue({ data: undefined } as any);

    renderWatchesPage();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Watches" })).toBeInTheDocument();
    });
  });
});
