import { useQuery } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useWatchRuns } from "../api/watchRuns";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false, isError: false }),
}));

vi.mock("../api/client", () => ({
  apiFetch: vi.fn(),
}));

describe("useWatchRuns", () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockClear();
  });

  it("polls every 5 seconds", () => {
    renderHook(() => useWatchRuns("watch-1"));
    expect(vi.mocked(useQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ refetchInterval: 5000 }),
    );
  });

  it("does not poll in background tabs", () => {
    renderHook(() => useWatchRuns("watch-1"));
    expect(vi.mocked(useQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ refetchIntervalInBackground: false }),
    );
  });

  it("uses watchId and page in query key (defaults to page 1)", () => {
    renderHook(() => useWatchRuns("watch-abc"));
    expect(vi.mocked(useQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["watch-runs", "watch-abc", 1] }),
    );
  });

  it("includes page in query key when specified", () => {
    renderHook(() => useWatchRuns("watch-abc", 3));
    expect(vi.mocked(useQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["watch-runs", "watch-abc", 3] }),
    );
  });
});
