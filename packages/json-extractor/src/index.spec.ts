import { describe, expect, it } from "vitest";
import { evaluateJsonPath } from "./index";

const JSON_TEXT = JSON.stringify({
  data: { price: 42000, label: "BTC/USD" },
  items: [10, 20, 30],
});

describe("evaluateJsonPath", () => {
  describe("match", () => {
    it("returns the first match as a string-coerced primary value", () => {
      const result = evaluateJsonPath(JSON_TEXT, "$.data.price");
      expect(result.error).toBeNull();
      expect(result.primary).toBe("42000");
    });

    it("returns a string value unchanged", () => {
      const result = evaluateJsonPath(JSON_TEXT, "$.data.label");
      expect(result.error).toBeNull();
      expect(result.primary).toBe("BTC/USD");
    });

    it("includes all matched values in allValues", () => {
      const result = evaluateJsonPath(JSON_TEXT, "$.items[*]");
      expect(result.error).toBeNull();
      expect(result.allValues).toEqual([10, 20, 30]);
      expect(result.primary).toBe("10");
    });
  });

  describe("no match", () => {
    it("returns null primary with empty allValues and no error when path matches nothing", () => {
      const result = evaluateJsonPath(JSON_TEXT, "$.nonexistent.path");
      expect(result.primary).toBeNull();
      expect(result.allValues).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe("invalid JSON", () => {
    it("returns an error for unparseable JSON", () => {
      const result = evaluateJsonPath("not json", "$.foo");
      expect(result.primary).toBeNull();
      expect(result.allValues).toEqual([]);
      expect(result.error).toBe("Response is not valid JSON");
    });
  });

  describe("invalid expression", () => {
    it("returns no match (not an error) for a malformed JSONPath expression", () => {
      // jsonpath-plus does not throw for malformed paths — it returns empty results
      const result = evaluateJsonPath(JSON_TEXT, "[[invalid");
      expect(result.primary).toBeNull();
      expect(result.allValues).toEqual([]);
      expect(result.error).toBeNull();
    });
  });
});
