import "reflect-metadata";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MailComposer } from "./mail-composer";

const BASE_URL = "https://vigil.example.com";
const watch = { id: "watch-abc", name: "My Price Watch" };
const user = { email: "user@example.com" };
const runTime = new Date("2026-05-15T10:30:00.000Z");

describe("MailComposer", () => {
  let composer: MailComposer;

  beforeEach(() => {
    vi.stubEnv("PUBLIC_BASE_URL", BASE_URL);
    composer = new MailComposer();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("CONDITION_MET email", () => {
    it("produces correct subject for condition met", () => {
      const result = composer.compose("CONDITION_MET", watch, { startedAt: runTime, extractedValue: "42.00", error: null }, user);
      expect(result.subject).toBe("Vigil alert: condition met — My Price Watch");
    });

    it("addresses email to user", () => {
      const result = composer.compose("CONDITION_MET", watch, { startedAt: runTime, extractedValue: "42.00", error: null }, user);
      expect(result.to).toBe("user@example.com");
    });

    it("body contains watch name, run time, value, and SPA link", () => {
      const result = composer.compose("CONDITION_MET", watch, { startedAt: runTime, extractedValue: "42.00", error: null }, user);
      expect(result.text).toContain("My Price Watch");
      expect(result.text).toContain("2026-05-15T10:30:00.000Z");
      expect(result.text).toContain("42.00");
      expect(result.text).toContain(`${BASE_URL}/watches/watch-abc`);
    });

    it("shows (none) when extractedValue is null", () => {
      const result = composer.compose("CONDITION_MET", watch, { startedAt: runTime, extractedValue: null, error: null }, user);
      expect(result.text).toContain("(none)");
    });

    it("truncates long extracted values to 200 chars with ellipsis", () => {
      const longValue = "x".repeat(300);
      const result = composer.compose("CONDITION_MET", watch, { startedAt: runTime, extractedValue: longValue, error: null }, user);
      expect(result.text).toContain("x".repeat(200) + "…");
      expect(result.text).not.toContain("x".repeat(201) + "x");
    });

    it("sanitizes newlines in extracted value", () => {
      const result = composer.compose("CONDITION_MET", watch, { startedAt: runTime, extractedValue: "line1\nline2\r\nline3", error: null }, user);
      expect(result.text).not.toMatch(/line1\nline2/);
      expect(result.text).toContain("line1 line2 line3");
    });
  });

  describe("EXECUTION_ERROR email", () => {
    it("produces correct subject for execution error", () => {
      const result = composer.compose("EXECUTION_ERROR", watch, { startedAt: runTime, extractedValue: null, error: "Connection refused" }, user);
      expect(result.subject).toBe("Vigil alert: execution error — My Price Watch");
    });

    it("body contains watch name, run time, error excerpt, and SPA link", () => {
      const result = composer.compose("EXECUTION_ERROR", watch, { startedAt: runTime, extractedValue: null, error: "Connection refused" }, user);
      expect(result.text).toContain("My Price Watch");
      expect(result.text).toContain("2026-05-15T10:30:00.000Z");
      expect(result.text).toContain("Connection refused");
      expect(result.text).toContain(`${BASE_URL}/watches/watch-abc`);
    });

    it("shows (unknown error) when error is null", () => {
      const result = composer.compose("EXECUTION_ERROR", watch, { startedAt: runTime, extractedValue: null, error: null }, user);
      expect(result.text).toContain("(unknown error)");
    });

    it("truncates long error strings to 200 chars with ellipsis", () => {
      const longError = "e".repeat(300);
      const result = composer.compose("EXECUTION_ERROR", watch, { startedAt: runTime, extractedValue: null, error: longError }, user);
      expect(result.text).toContain("e".repeat(200) + "…");
    });

    it("sanitizes newlines in error excerpt", () => {
      const result = composer.compose("EXECUTION_ERROR", watch, { startedAt: runTime, extractedValue: null, error: "err\nline2" }, user);
      expect(result.text).toContain("err line2");
    });
  });

  describe("PUBLIC_BASE_URL", () => {
    it("uses empty string as base when PUBLIC_BASE_URL is not set", () => {
      vi.unstubAllEnvs();
      delete process.env["PUBLIC_BASE_URL"];
      const result = composer.compose("CONDITION_MET", watch, { startedAt: runTime, extractedValue: "v", error: null }, user);
      expect(result.text).toContain("/watches/watch-abc");
    });

    it("strips trailing slash from PUBLIC_BASE_URL", () => {
      vi.stubEnv("PUBLIC_BASE_URL", "https://vigil.example.com/");
      const result = composer.compose("CONDITION_MET", watch, { startedAt: runTime, extractedValue: "v", error: null }, user);
      expect(result.text).toContain("https://vigil.example.com/watches/watch-abc");
      expect(result.text).not.toContain("//watches");
    });
  });

  describe("watch name safety", () => {
    it("sanitizes newlines in watch name for subject and body", () => {
      const result = composer.compose("CONDITION_MET", { id: "w1", name: "Watch\nName" }, { startedAt: runTime, extractedValue: "v", error: null }, user);
      expect(result.subject).not.toContain("\n");
      expect(result.text).not.toContain("Watch\nName");
    });

    it("truncates very long watch names in subject", () => {
      const longName = "W".repeat(200);
      const result = composer.compose("CONDITION_MET", { id: "w1", name: longName }, { startedAt: runTime, extractedValue: "v", error: null }, user);
      expect(result.subject).toContain("W".repeat(100) + "…");
    });
  });
});
