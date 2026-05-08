import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import { JSONPath } from "jsonpath-plus";
import type {
  ConditionOperator,
  ExecuteOptions,
  ExecutorResult,
  WatchInput,
} from "./executor.types";

@Injectable()
export class ExecutorService {
  async execute(
    watch: WatchInput,
    options: ExecuteOptions = {},
  ): Promise<ExecutorResult> {
    let responseText: string;
    try {
      const response = await fetch(watch.targetUrl);
      responseText = await response.text();
    } catch (err) {
      return {
        extractedValue: null,
        conditionMet: null,
        error: `Failed to fetch ${watch.targetUrl}: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    let extractedValue: string | null;
    try {
      if (watch.responseType === "HTML") {
        extractedValue = extractFromHtml(responseText, watch.extractorExpression);
      } else {
        extractedValue = extractFromJson(responseText, watch.extractorExpression);
      }
    } catch (err) {
      return {
        extractedValue: null,
        conditionMet: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    if (extractedValue === null) {
      return {
        extractedValue: null,
        conditionMet: null,
        error: `Selector/path "${watch.extractorExpression}" matched nothing in the response`,
      };
    }

    const conditionMet = evaluateCondition(
      extractedValue,
      watch.conditionOperator,
      watch.expectedValue,
      options.previousExtractedValue ?? null,
    );

    return { extractedValue, conditionMet, error: null };
  }
}

function extractFromHtml(html: string, selector: string): string | null {
  const $ = cheerio.load(html);
  const el = $(selector).first();
  if (!el.length) return null;
  return el.text().trim();
}

function extractFromJson(json: string, path: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Response is not valid JSON");
  }
  const results = JSONPath({
    path,
    json: parsed as object,
    resultType: "value",
  }) as unknown[];
  if (!results.length) return null;
  return String(results[0]);
}

function evaluateCondition(
  extractedValue: string,
  operator: ConditionOperator,
  expectedValue: string | null,
  previousValue: string | null,
): boolean {
  switch (operator) {
    case "EQUALS":
      return extractedValue === expectedValue;
    case "CHANGED":
      return extractedValue !== previousValue;
    case "LESS_THAN": {
      const current = parseFloat(extractedValue);
      const prev = parseFloat(previousValue ?? "");
      return !isNaN(current) && !isNaN(prev) && current < prev;
    }
    case "GREATER_THAN": {
      const current = parseFloat(extractedValue);
      const prev = parseFloat(previousValue ?? "");
      return !isNaN(current) && !isNaN(prev) && current > prev;
    }
  }
}
