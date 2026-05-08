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
import * as useUpdateWatchModule from "../gql/hooks/useUpdateWatch";
import * as useDeleteWatchModule from "../gql/hooks/useDeleteWatch";
import * as useWatchRunsModule from "../gql/hooks/useWatchRuns";
import * as useRunWatchModule from "../gql/hooks/useRunWatch";

vi.mock("../gql/hooks/useWatch");
vi.mock("../gql/hooks/useUpdateWatch");
vi.mock("../gql/hooks/useDeleteWatch");
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

function renderEditApp(id = "1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/watches/${id}/edit`] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

function renderDetailApp(id = "1") {
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

describe("Edit Watch page", () => {
  beforeEach(() => {
    vi.mocked(useUpdateWatchModule.useUpdateWatch).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { watchRuns: [] },
      isLoading: false,
    } as any);
    vi.mocked(useRunWatchModule.useRunWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
    vi.mocked(useDeleteWatchModule.useDeleteWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it("shows loading while watch is fetching", async () => {
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    renderEditApp();
    await waitFor(() => {
      expect(screen.getByText(/loading watch/i)).toBeInTheDocument();
    });
  });

  it("shows error when watch not found", async () => {
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: null },
      isLoading: false,
      isError: false,
    } as any);

    renderEditApp();
    await waitFor(() => {
      expect(screen.getByText(/watch not found/i)).toBeInTheDocument();
    });
  });

  it("pre-populates form with existing watch values", async () => {
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);

    renderEditApp();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /edit watch/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue("Example Watch")).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://example.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("h1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("*/5 * * * *")).toBeInTheDocument();
    });
  });

  it("pre-populates expected value when watch uses EQUALS", async () => {
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: {
        watch: { ...mockWatch, conditionOperator: "EQUALS", expectedValue: "42" },
      },
      isLoading: false,
      isError: false,
    } as any);

    renderEditApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/expected value/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("42")).toBeInTheDocument();
    });
  });

  it("calls updateWatch mutation with correct values on submit", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ updateWatch: mockWatch });
    vi.mocked(useUpdateWatchModule.useUpdateWatch).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);

    renderEditApp();
    await waitFor(() => {
      expect(screen.getByDisplayValue("Example Watch")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Updated Watch" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        id: "1",
        input: expect.objectContaining({ name: "Updated Watch" }),
      });
    });
  });

  it("shows server error when update fails", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error("Invalid cron expression"));
    vi.mocked(useUpdateWatchModule.useUpdateWatch).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);

    renderEditApp();
    await waitFor(() => {
      expect(screen.getByDisplayValue("Example Watch")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid cron expression/i)).toBeInTheDocument();
    });
  });

  it("has a back link to the watch detail page", async () => {
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);

    renderEditApp();
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /← example watch/i })).toBeInTheDocument();
    });
  });
});

describe("Delete Watch (detail page)", () => {
  beforeEach(() => {
    vi.mocked(useWatchModule.useWatch).mockReturnValue({
      data: { watch: mockWatch },
      isLoading: false,
      isError: false,
    } as any);
    vi.mocked(useWatchRunsModule.useWatchRuns).mockReturnValue({
      data: { watchRuns: [] },
      isLoading: false,
    } as any);
    vi.mocked(useRunWatchModule.useRunWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
    vi.mocked(useUpdateWatchModule.useUpdateWatch).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  it("shows a Delete button on the watch detail page", async () => {
    vi.mocked(useDeleteWatchModule.useDeleteWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    renderDetailApp();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
    });
  });

  it("shows confirmation buttons after clicking Delete", async () => {
    vi.mocked(useDeleteWatchModule.useDeleteWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    renderDetailApp();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
    });
  });

  it("calls deleteWatch mutation on confirm", async () => {
    const mutate = vi.fn();
    vi.mocked(useDeleteWatchModule.useDeleteWatch).mockReturnValue({
      mutate,
      isPending: false,
    } as any);

    renderDetailApp();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));
    expect(mutate).toHaveBeenCalledWith("1", expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it("cancels deletion and hides confirmation when Cancel is clicked", async () => {
    vi.mocked(useDeleteWatchModule.useDeleteWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    renderDetailApp();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /confirm delete/i })).not.toBeInTheDocument();
    });
  });

  it("shows Edit link on the watch detail page", async () => {
    vi.mocked(useDeleteWatchModule.useDeleteWatch).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    renderDetailApp();
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /^edit$/i })).toBeInTheDocument();
    });
  });
});
