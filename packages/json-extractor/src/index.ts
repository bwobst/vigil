import { JSONPath } from "jsonpath-plus";

export interface JsonExtractionResult {
  primary: string | null;
  allValues: unknown[];
  error: string | null;
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

  return { primary: String(results[0]), allValues: results, error: null };
}
