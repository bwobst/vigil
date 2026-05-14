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
import * as sessionModule from "../api/session";

vi.mock("../api/watches");
vi.mock("../api/session");

function renderApp(initialPath = "/watches/new") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("Create Watch page", () => {
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
    vi.mocked(useWatchesModule.useCreateWatch).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  it("renders the create form with all fields", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /new watch/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/response type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/extractor expression/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/condition operator/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/schedule/i)).toBeInTheDocument();
    });
  });

  it("does not show expected value field by default (CHANGED operator)", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.queryByLabelText(/expected value/i)).not.toBeInTheDocument();
    });
  });

  it("shows expected value field when EQUALS is selected", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/condition operator/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/condition operator/i), {
      target: { value: "EQUALS" },
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/expected value/i)).toBeInTheDocument();
    });
  });

  it("shows validation errors when required fields are empty", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create watch/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /create watch/i }));
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/target url is required/i)).toBeInTheDocument();
      expect(screen.getByText(/extractor expression is required/i)).toBeInTheDocument();
      expect(screen.getByText(/schedule expression is required/i)).toBeInTheDocument();
    });
  });

  it("requires expected value when EQUALS is selected", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/condition operator/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/condition operator/i), {
      target: { value: "EQUALS" },
    });
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "My Watch" } });
    fireEvent.change(screen.getByLabelText(/target url/i), {
      target: { value: "https://example.com" },
    });
    fireEvent.change(screen.getByLabelText(/extractor expression/i), {
      target: { value: "h1" },
    });
    fireEvent.change(screen.getByLabelText(/schedule/i), {
      target: { value: "*/5 * * * *" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create watch/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/expected value is required for equals condition/i),
      ).toBeInTheDocument();
    });
  });

  it("calls createWatch mutation with correct values on valid submit", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: "42" });
    vi.mocked(useWatchesModule.useCreateWatch).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Price Watch" } });
    fireEvent.change(screen.getByLabelText(/target url/i), {
      target: { value: "https://shop.example.com" },
    });
    fireEvent.change(screen.getByLabelText(/extractor expression/i), {
      target: { value: ".price" },
    });
    fireEvent.change(screen.getByLabelText(/schedule/i), {
      target: { value: "*/10 * * * *" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create watch/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Price Watch",
          targetUrl: "https://shop.example.com",
          responseType: "HTML",
          extractorExpression: ".price",
          conditionOperator: "CHANGED",
          expectedValue: null,
          scheduleExpression: "*/10 * * * *",
        }),
      );
    });
  });

  it("shows server error when mutation fails", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error("Invalid cron expression"));
    vi.mocked(useWatchesModule.useCreateWatch).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "My Watch" } });
    fireEvent.change(screen.getByLabelText(/target url/i), {
      target: { value: "https://example.com" },
    });
    fireEvent.change(screen.getByLabelText(/extractor expression/i), {
      target: { value: "h1" },
    });
    fireEvent.change(screen.getByLabelText(/schedule/i), {
      target: { value: "bad cron" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create watch/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid cron expression/i)).toBeInTheDocument();
    });
  });

  it("disables buttons and shows saving state while pending", async () => {
    vi.mocked(useWatchesModule.useCreateWatch).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);

    renderApp();
    await waitFor(() => {
      const saveBtn = screen.getByRole("button", { name: /saving/i });
      expect(saveBtn).toBeDisabled();
    });
  });

  it("has a back link to the watches list", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /← watches/i })).toBeInTheDocument();
    });
  });
});
