import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { routeTree } from "../routeTree.gen";
import * as sessionModule from "../api/session";
import { ApiError } from "../api/client";

vi.mock("../api/session");

function renderApp(initialPath = "/sign-in") {
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

describe("Sign-in page", () => {
  beforeEach(() => {
    vi.mocked(sessionModule.useSession).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
    } as any);
    vi.mocked(sessionModule.useSignOut).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
    vi.mocked(sessionModule.useSignIn).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  it("renders the sign-in form", async () => {
    vi.mocked(sessionModule.useSignIn).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it("calls signIn mutation with email and password on submit", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    vi.mocked(sessionModule.useSignIn).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret123",
      });
    });
  });

  it("shows invalid credentials error on 401", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new ApiError(401, "Unauthorized"));
    vi.mocked(sessionModule.useSignIn).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid email or password/i);
    });
  });

  it("shows rate limit error on 429", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new ApiError(429, "Too Many Requests"));
    vi.mocked(sessionModule.useSignIn).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/too many sign-in attempts/i);
    });
  });

  it("disables button and shows loading text while signing in", async () => {
    vi.mocked(sessionModule.useSignIn).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);

    renderApp();
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /signing in/i });
      expect(btn).toBeDisabled();
    });
  });
});
