import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  normalizeMode,
  readStored,
  resolveEffective,
  writeStored,
} from "../lib/theme";

describe("normalizeMode", () => {
  it("passes through light", () => {
    expect(normalizeMode("light")).toBe("light");
  });

  it("passes through dark", () => {
    expect(normalizeMode("dark")).toBe("dark");
  });

  it("passes through system", () => {
    expect(normalizeMode("system")).toBe("system");
  });

  it("maps null to system", () => {
    expect(normalizeMode(null)).toBe("system");
  });

  it("maps undefined to system", () => {
    expect(normalizeMode(undefined)).toBe("system");
  });

  it("maps unknown string to system", () => {
    expect(normalizeMode("invalid")).toBe("system");
  });

  it("maps empty string to system", () => {
    expect(normalizeMode("")).toBe("system");
  });

  it("maps number to system", () => {
    expect(normalizeMode(42)).toBe("system");
  });
});

describe("resolveEffective", () => {
  it("returns dark when stored=dark and OS=light", () => {
    expect(resolveEffective("dark", false)).toBe("dark");
  });

  it("returns dark when stored=dark and OS=dark", () => {
    expect(resolveEffective("dark", true)).toBe("dark");
  });

  it("returns light when stored=light and OS=light", () => {
    expect(resolveEffective("light", false)).toBe("light");
  });

  it("returns light when stored=light and OS=dark", () => {
    expect(resolveEffective("light", true)).toBe("light");
  });

  it("returns dark when stored=system and OS=dark", () => {
    expect(resolveEffective("system", true)).toBe("dark");
  });

  it("returns light when stored=system and OS=light", () => {
    expect(resolveEffective("system", false)).toBe("light");
  });
});

describe("readStored", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns system when storage is empty", () => {
    expect(readStored()).toBe("system");
  });

  it("returns light for stored light", () => {
    localStorage.setItem(STORAGE_KEY, "light");
    expect(readStored()).toBe("light");
  });

  it("returns dark for stored dark", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    expect(readStored()).toBe("dark");
  });

  it("returns system for stored system", () => {
    localStorage.setItem(STORAGE_KEY, "system");
    expect(readStored()).toBe("system");
  });

  it("returns system for invalid stored value and self-heals", () => {
    localStorage.setItem(STORAGE_KEY, "bogus");
    expect(readStored()).toBe("system");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("system");
  });

  it("self-heals when stored value is empty string", () => {
    localStorage.setItem(STORAGE_KEY, "");
    expect(readStored()).toBe("system");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("system");
  });
});

describe("writeStored", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists light", () => {
    writeStored("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("persists dark", () => {
    writeStored("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("persists system", () => {
    writeStored("system");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("system");
  });
});
