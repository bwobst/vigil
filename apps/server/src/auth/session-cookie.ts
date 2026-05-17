import type { Request } from "express";

/** Whether the session cookie should include the Secure attribute. */
export function isSessionCookieSecure(req: Request): boolean {
  const explicit = process.env["SESSION_COOKIE_SECURE"];
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return req.secure;
}

export function sessionCookieOptions(req: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSessionCookieSecure(req),
    path: "/",
    maxAge: 365 * 24 * 60 * 60 * 1000,
  };
}

export function sessionClearCookieOptions(req: Request) {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: isSessionCookieSecure(req),
  };
}
