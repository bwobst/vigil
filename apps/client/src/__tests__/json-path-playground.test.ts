import { describe, expect, it } from "vitest";
import { getPreviewState } from "../components/JsonPathPlayground";

const SAMPLE = JSON.stringify({ data: { price: 42000, label: "BTC" }, items: [10, 20, 30] });

describe("getPreviewState", () => {
  it("returns empty when sampleJson is blank", () => {
    expect(getPreviewState("", "$.data.price")).toEqual({ type: "empty" });
    expect(getPreviewState("   ", "$.data.price")).toEqual({ type: "empty" });
  });

  it("returns match with primary string for a single-value path", () => {
    const state = getPreviewState(SAMPLE, "$.data.price");
    expect(state).toMatchObject({ type: "match", primary: "42000" });
  });

  it("returns match with all values for a multi-value path", () => {
    const state = getPreviewState(SAMPLE, "$.items[*]");
    expect(state.type).toBe("match");
    if (state.type === "match") {
      expect(state.primary).toBe("10");
      expect(state.all).toHaveLength(3);
    }
  });

  it("returns no-matches when path matches nothing", () => {
    expect(getPreviewState(SAMPLE, "$.nonexistent")).toEqual({ type: "no-matches" });
  });

  it("returns error for invalid JSON", () => {
    const state = getPreviewState("not-json", "$.data.price");
    expect(state.type).toBe("error");
  });

  it("returns no-matches for a malformed JSONPath expression (jsonpath-plus silently returns empty)", () => {
    const state = getPreviewState(SAMPLE, "[[[invalid");
    expect(state.type).toBe("no-matches");
  });

  it("primary value matches what the executor would use (string coercion)", () => {
    const state = getPreviewState(SAMPLE, "$.data.label");
    expect(state).toMatchObject({ type: "match", primary: "BTC" });
  });
});
