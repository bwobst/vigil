import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import { evaluateJsonPath } from "@vigil/json-extractor";
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
    if (watch.responseType === "HTML") {
      try {
        extractedValue = extractFromHtml(responseText, watch.extractorExpression);
      } catch (err) {
        return {
          extractedValue: null,
          conditionMet: null,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    } else {
      const jsonResult = evaluateJsonPath(responseText, watch.extractorExpression);
      if (jsonResult.error) {
        return { extractedValue: null, conditionMet: null, error: jsonResult.error };
      }
      extractedValue = jsonResult.primary;
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

const STRICT_NUMERIC = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/;

/**
 * Parses text for LESS_THAN / GREATER_THAN so plain thresholds (e.g. "190") compare
 * correctly to formatted extracted values (e.g. "190.00", "$190.00", "1,900.50").
 */
function parseComparableNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const noCommas = trimmed.replace(/,/g, "");
  if (STRICT_NUMERIC.test(noCommas)) {
    const n = Number(noCommas);
    return Number.isFinite(n) ? n : null;
  }

  const match = trimmed.match(/-?(?:\d[\d,]*(?:\.\d+)?|\.\d+)(?:[eE][-+]?\d+)?/);
  if (!match) return null;
  const token = match[0].replace(/,/g, "");
  const n = Number(token);
  return Number.isFinite(n) ? n : null;
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
      const current = parseComparableNumber(extractedValue);
      const threshold = parseComparableNumber(expectedValue ?? "");
      return current !== null && threshold !== null && current < threshold;
    }
    case "GREATER_THAN": {
      const current = parseComparableNumber(extractedValue);
      const threshold = parseComparableNumber(expectedValue ?? "");
      return current !== null && threshold !== null && current > threshold;
    }
  }
}
