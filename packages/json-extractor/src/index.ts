import { JSONPath } from "jsonpath-plus";

export interface JsonExtractionResult {
  primary: string | null;
  allValues: unknown[];
  error: string | null;
}

/** String form of a JSONPath match: primitives as before; objects/arrays as pretty-printed JSON. */
export function formatJsonPathValue(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function evaluateJsonPath(jsonText: string, path: string): JsonExtractionResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { primary: null, allValues: [], error: "Response is not valid JSON" };
  }

  let results: unknown[];
  try {
    results = JSONPath({ path, json: parsed as object, resultType: "value" }) as unknown[];
  } catch (err) {
    return {
      primary: null,
      allValues: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (!results.length) {
    return { primary: null, allValues: [], error: null };
  }

  return { primary: formatJsonPathValue(results[0]), allValues: results, error: null };
}
