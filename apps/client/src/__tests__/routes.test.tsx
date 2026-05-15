import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { routeTree } from "../routeTree.gen";
import * as sessionModule from "../api/session";
import { ThemeProvider } from "../components/ThemeProvider";

vi.mock("../api/session");

function renderApp(initialPath = "/") {
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

describe("App routing", () => {
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
  });

  it("renders the home page", async () => {
    renderApp("/");
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /welcome to vigil/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders the about page", async () => {
    renderApp("/about");
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "About" }),
      ).toBeInTheDocument();
    });
  });

  it.each(["/", "/about"])("shows navigation links on %s", async (path) => {
    renderApp(path);
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    });
  });

  it.each(["/", "/about"])(
    "shows Vigil brand link navigating to home on %s",
    async (path) => {
      renderApp(path);
      await waitFor(() => {
        const brand = screen.getByRole("link", { name: "Vigil" });
        expect(brand).toBeInTheDocument();
        expect(brand).toHaveAttribute("href", "/");
      });
    },
  );

  it("renders the sign-in page", async () => {
    vi.mocked(sessionModule.useSession).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
    } as any);
    vi.mocked(sessionModule.useSignIn).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    renderApp("/sign-in");
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it("opens the account menu to show email and sign out when authenticated", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /signed in as user@example.com/i }),
      ).toBeInTheDocument();
    });
    await user.click(
      screen.getByRole("button", { name: /signed in as user@example.com/i }),
    );
    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
    });
  });
});
