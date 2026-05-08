import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExecutorService } from "./executor.service";

const HTML_RESPONSE = `
<html>
  <body>
    <h1>Bitcoin Price</h1>
    <span class="price">42000</span>
    <p class="description">The current price</p>
  </body>
</html>
`;

const JSON_RESPONSE = JSON.stringify({
  data: {
    price: 42000,
    label: "BTC/USD",
    nested: { value: "hello" },
  },
  items: [10, 20, 30],
});

function mockFetch(body: string, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    text: () => Promise.resolve(body),
  });
}

describe("ExecutorService", () => {
  let service: ExecutorService;

  beforeEach(() => {
    service = new ExecutorService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("HTML extraction", () => {
    it("extracts a value using a CSS selector", async () => {
      vi.stubGlobal("fetch", mockFetch(HTML_RESPONSE));

      const result = await service.execute({
        targetUrl: "https://example.com",
        responseType: "HTML",
        extractorExpression: ".price",
        conditionOperator: "EQUALS",
        expectedValue: "42000",
      });

      expect(result.extractedValue).toBe("42000");
      expect(result.conditionMet).toBe(true);
      expect(result.error).toBeNull();
    });

    it("returns an error result when the CSS selector matches nothing", async () => {
      vi.stubGlobal("fetch", mockFetch(HTML_RESPONSE));

      const result = await service.execute({
        targetUrl: "https://example.com",
        responseType: "HTML",
        extractorExpression: ".nonexistent",
        conditionOperator: "EQUALS",
        expectedValue: "42000",
      });

      expect(result.extractedValue).toBeNull();
      expect(result.conditionMet).toBeNull();
      expect(result.error).toMatch(/matched nothing/i);
    });
  });

  describe("JSON extraction", () => {
    it("extracts a value using a JSONPath expression", async () => {
      vi.stubGlobal("fetch", mockFetch(JSON_RESPONSE));

      const result = await service.execute({
        targetUrl: "https://api.example.com/price",
        responseType: "JSON",
        extractorExpression: "$.data.price",
        conditionOperator: "EQUALS",
        expectedValue: "42000",
      });

      expect(result.extractedValue).toBe("42000");
      expect(result.conditionMet).toBe(true);
      expect(result.error).toBeNull();
    });

    it("extracts a string value using a JSONPath expression", async () => {
      vi.stubGlobal("fetch", mockFetch(JSON_RESPONSE));

      const result = await service.execute({
        targetUrl: "https://api.example.com/price",
        responseType: "JSON",
        extractorExpression: "$.data.nested.value",
        conditionOperator: "EQUALS",
        expectedValue: "hello",
      });

      expect(result.extractedValue).toBe("hello");
      expect(result.conditionMet).toBe(true);
      expect(result.error).toBeNull();
    });

    it("returns an error result when the JSONPath expression matches nothing", async () => {
      vi.stubGlobal("fetch", mockFetch(JSON_RESPONSE));

      const result = await service.execute({
        targetUrl: "https://api.example.com/price",
        responseType: "JSON",
        extractorExpression: "$.nonexistent.path",
        conditionOperator: "EQUALS",
        expectedValue: "42000",
      });

      expect(result.extractedValue).toBeNull();
      expect(result.conditionMet).toBeNull();
      expect(result.error).toMatch(/matched nothing/i);
    });

    it("returns an error result when response is not valid JSON", async () => {
      vi.stubGlobal("fetch", mockFetch("not json"));

      const result = await service.execute({
        targetUrl: "https://api.example.com",
        responseType: "JSON",
        extractorExpression: "$.foo",
        conditionOperator: "EQUALS",
        expectedValue: "bar",
      });

      expect(result.extractedValue).toBeNull();
      expect(result.conditionMet).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe("condition operators", () => {
    async function runWith(
      conditionOperator: string,
      extractedValue: string,
      opts: { expectedValue?: string; previousExtractedValue?: string } = {},
    ) {
      vi.stubGlobal(
        "fetch",
        mockFetch(`<span class="v">${extractedValue}</span>`),
      );
      return service.execute(
        {
          targetUrl: "https://example.com",
          responseType: "HTML",
          extractorExpression: ".v",
          conditionOperator: conditionOperator as never,
          expectedValue: opts.expectedValue ?? null,
        },
        { previousExtractedValue: opts.previousExtractedValue },
      );
    }

    describe("EQUALS", () => {
      it("returns conditionMet true when extracted matches expected", async () => {
        const result = await runWith("EQUALS", "hello", {
          expectedValue: "hello",
        });
        expect(result.conditionMet).toBe(true);
      });

      it("returns conditionMet false when extracted does not match expected", async () => {
        const result = await runWith("EQUALS", "hello", {
          expectedValue: "world",
        });
        expect(result.conditionMet).toBe(false);
      });
    });

    describe("CHANGED", () => {
      it("returns conditionMet true when extracted value differs from previous", async () => {
        const result = await runWith("CHANGED", "new-value", {
          previousExtractedValue: "old-value",
        });
        expect(result.conditionMet).toBe(true);
      });

      it("returns conditionMet false when extracted value is same as previous", async () => {
        const result = await runWith("CHANGED", "same", {
          previousExtractedValue: "same",
        });
        expect(result.conditionMet).toBe(false);
      });

      it("returns conditionMet true when there is no previous value", async () => {
        const result = await runWith("CHANGED", "first-value");
        expect(result.conditionMet).toBe(true);
      });
    });

    describe("LESS_THAN", () => {
      it("returns conditionMet true when extracted is less than previous", async () => {
        const result = await runWith("LESS_THAN", "30", {
          previousExtractedValue: "50",
        });
        expect(result.conditionMet).toBe(true);
      });

      it("returns conditionMet false when extracted is greater than previous", async () => {
        const result = await runWith("LESS_THAN", "70", {
          previousExtractedValue: "50",
        });
        expect(result.conditionMet).toBe(false);
      });

      it("returns conditionMet false when extracted equals previous", async () => {
        const result = await runWith("LESS_THAN", "50", {
          previousExtractedValue: "50",
        });
        expect(result.conditionMet).toBe(false);
      });
    });

    describe("GREATER_THAN", () => {
      it("returns conditionMet true when extracted is greater than previous", async () => {
        const result = await runWith("GREATER_THAN", "70", {
          previousExtractedValue: "50",
        });
        expect(result.conditionMet).toBe(true);
      });

      it("returns conditionMet false when extracted is less than previous", async () => {
        const result = await runWith("GREATER_THAN", "30", {
          previousExtractedValue: "50",
        });
        expect(result.conditionMet).toBe(false);
      });
    });
  });

  describe("error handling", () => {
    it("returns an error result when the target URL is unreachable", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
      );

      const result = await service.execute({
        targetUrl: "https://unreachable.example.com",
        responseType: "HTML",
        extractorExpression: "h1",
        conditionOperator: "EQUALS",
        expectedValue: "hello",
      });

      expect(result.extractedValue).toBeNull();
      expect(result.conditionMet).toBeNull();
      expect(result.error).toMatch(/ECONNREFUSED/);
    });
  });
});
