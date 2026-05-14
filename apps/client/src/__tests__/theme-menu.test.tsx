import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ThemeMenu } from "../components/ThemeMenu";
import * as ThemeProviderModule from "../components/ThemeProvider";

vi.mock("../components/ThemeProvider", () => ({
  useTheme: vi.fn(),
}));

function renderThemeMenu(storedMode: "light" | "dark" | "system" = "system") {
  const setMode = vi.fn();
  vi.mocked(ThemeProviderModule.useTheme).mockReturnValue({
    storedMode,
    setMode,
  });
  render(<ThemeMenu />);
  return { setMode };
}

describe("ThemeMenu", () => {
  beforeEach(() => {
    vi.mocked(ThemeProviderModule.useTheme).mockClear();
  });

  it("renders a trigger button with an accessible label reflecting stored mode", () => {
    renderThemeMenu("light");
    expect(screen.getByRole("button", { name: /theme: light/i })).toBeInTheDocument();
  });

  it("trigger label updates when stored mode is dark", () => {
    renderThemeMenu("dark");
    expect(screen.getByRole("button", { name: /theme: dark/i })).toBeInTheDocument();
  });

  it("trigger label updates when stored mode is system", () => {
    renderThemeMenu("system");
    expect(screen.getByRole("button", { name: /theme: system/i })).toBeInTheDocument();
  });

  it("shows all three menu items when trigger is clicked", async () => {
    const user = userEvent.setup();
    renderThemeMenu("system");
    await user.click(screen.getByRole("button", { name: /theme/i }));
    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: /light/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: /dark/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: /system/i })).toBeInTheDocument();
    });
  });

  it("System menu item shows a muted device hint", async () => {
    const user = userEvent.setup();
    renderThemeMenu("system");
    await user.click(screen.getByRole("button", { name: /theme/i }));
    await waitFor(() => {
      expect(screen.getByText("Device")).toBeInTheDocument();
    });
  });

  it("calls setMode with 'light' when Light is clicked", async () => {
    const user = userEvent.setup();
    const { setMode } = renderThemeMenu("system");
    await user.click(screen.getByRole("button", { name: /theme/i }));
    await waitFor(() => screen.getByRole("menuitem", { name: /light/i }));
    await user.click(screen.getByRole("menuitem", { name: /light/i }));
    expect(setMode).toHaveBeenCalledWith("light");
  });

  it("calls setMode with 'dark' when Dark is clicked", async () => {
    const user = userEvent.setup();
    const { setMode } = renderThemeMenu("light");
    await user.click(screen.getByRole("button", { name: /theme/i }));
    await waitFor(() => screen.getByRole("menuitem", { name: /dark/i }));
    await user.click(screen.getByRole("menuitem", { name: /dark/i }));
    expect(setMode).toHaveBeenCalledWith("dark");
  });

  it("calls setMode with 'system' when System is clicked", async () => {
    const user = userEvent.setup();
    const { setMode } = renderThemeMenu("light");
    await user.click(screen.getByRole("button", { name: /theme/i }));
    await waitFor(() => screen.getByRole("menuitem", { name: /system/i }));
    await user.click(screen.getByRole("menuitem", { name: /system/i }));
    expect(setMode).toHaveBeenCalledWith("system");
  });

  it("shows a check indicator next to the active stored mode", async () => {
    const user = userEvent.setup();
    renderThemeMenu("dark");
    await user.click(screen.getByRole("button", { name: /theme/i }));
    await waitFor(() => screen.getByRole("menuitem", { name: /dark/i }));
    const darkItem = screen.getByRole("menuitem", { name: /dark/i });
    expect(darkItem.querySelector("svg[aria-hidden]")).toBeTruthy();
  });
});
