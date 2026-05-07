import { render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createRouter, createMemoryHistory } from "@tanstack/react-router";
import { describe, it, expect } from "vitest";
import { routeTree } from "../routeTree.gen";

function renderApp(initialPath = "/") {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  return render(<RouterProvider router={router} />);
}

describe("App routing", () => {
  it("renders the home page", async () => {
    renderApp("/");
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /welcome to sandcastle/i })).toBeInTheDocument();
    });
  });

  it("renders the about page", async () => {
    renderApp("/about");
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    });
  });

  it("shows navigation links on home page", async () => {
    renderApp("/");
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    });
  });

  it("shows navigation links on about page", async () => {
    renderApp("/about");
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    });
  });
});
