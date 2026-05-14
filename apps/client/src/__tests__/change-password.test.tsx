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

function renderApp(initialPath = "/change-password") {
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

describe("Change password page", () => {
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
    vi.mocked(sessionModule.useChangePassword).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  it("renders the change password form", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /change password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText("New password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
    });
  });

  it("calls changePassword mutation with correct values on submit", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    vi.mocked(sessionModule.useChangePassword).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "OldPass1!" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "NewValidPass1!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "NewValidPass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        currentPassword: "OldPass1!",
        newPassword: "NewValidPass1!",
      });
    });
  });

  it("shows success message after successful password change", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    vi.mocked(sessionModule.useChangePassword).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "OldPass1!" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "NewValidPass1!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "NewValidPass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/password has been updated/i);
    });
  });

  it("shows error when new passwords do not match", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "OldPass1!" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "NewValidPass1!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "DifferentPass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/do not match/i);
    });
  });

  it("shows policy errors for weak new password", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "OldPass1!" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/at least 12 characters/i);
    });
  });

  it("shows error on 401 (wrong current password)", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new ApiError(401, "Unauthorized"));
    vi.mocked(sessionModule.useChangePassword).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "WrongPass1!" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "NewValidPass1!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "NewValidPass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/current password is incorrect/i);
    });
  });

  it("shows error on 422 (server-side policy violation)", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new ApiError(422, "Unprocessable Entity"));
    vi.mocked(sessionModule.useChangePassword).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderApp();
    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "OldPass1!" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "NewValidPass1!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "NewValidPass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/does not meet policy requirements/i);
    });
  });

  it("disables button and shows loading text while pending", async () => {
    vi.mocked(sessionModule.useChangePassword).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);

    renderApp();
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /updating/i });
      expect(btn).toBeDisabled();
    });
  });
});
