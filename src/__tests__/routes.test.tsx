import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
      expect(
        screen.getByRole("heading", { name: /welcome to sandcastle/i }),
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
});
