import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { isSessionCookieSecure } from "./session-cookie";

function mockRequest(secure: boolean, headers: Record<string, string> = {}): Request {
  return { secure, headers } as Request;
}

describe("isSessionCookieSecure", () => {
  it("returns false for plain HTTP when unset", () => {
    delete process.env["SESSION_COOKIE_SECURE"];
    expect(isSessionCookieSecure(mockRequest(false))).toBe(false);
  });

  it("returns true for HTTPS requests when unset", () => {
    delete process.env["SESSION_COOKIE_SECURE"];
    expect(isSessionCookieSecure(mockRequest(true))).toBe(true);
  });

  it("honours SESSION_COOKIE_SECURE=true", () => {
    process.env["SESSION_COOKIE_SECURE"] = "true";
    expect(isSessionCookieSecure(mockRequest(false))).toBe(true);
    delete process.env["SESSION_COOKIE_SECURE"];
  });

  it("honours SESSION_COOKIE_SECURE=false", () => {
    process.env["SESSION_COOKIE_SECURE"] = "false";
    expect(isSessionCookieSecure(mockRequest(true))).toBe(false);
    delete process.env["SESSION_COOKIE_SECURE"];
  });
});
