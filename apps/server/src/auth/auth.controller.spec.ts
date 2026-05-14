import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword } from "../password/password-hash";
import { AuthModule } from "./auth.module";
import { PrismaModule } from "../prisma/prisma.module";

const hasDb = !!process.env["DATABASE_URL"];

const TEST_EMAIL = "auth-test@vigil.app";
const TEST_PASSWORD = "Str0ng!Pass#12";
const COOKIE_NAME = "vigil_session";

function getSetCookieHeader(res: request.Response): string {
  const raw = res.headers["set-cookie"] as string | string[] | undefined;
  if (!raw) return "";
  return Array.isArray(raw) ? raw.join(";") : raw;
}

function getFirstSetCookie(res: request.Response): string {
  const raw = res.headers["set-cookie"] as string | string[] | undefined;
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0] ?? "") : raw;
}

describe.skipIf(!hasDb)("Auth HTTP API (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const hashed = await hashPassword(TEST_PASSWORD);
    await prisma.user.create({ data: { email: TEST_EMAIL, password: hashed } });
  });

  afterEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("POST /api/auth/sign-in", () => {
    it("returns 200 and sets session cookie on valid credentials", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      const cookies = getSetCookieHeader(res);
      expect(cookies).toContain(COOKIE_NAME);
      expect(cookies).toContain("HttpOnly");
    });

    it("creates a Session row on successful sign-in", async () => {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: TEST_EMAIL } });
      const before = await prisma.session.count({ where: { userId: user.id } });

      await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const after = await prisma.session.count({ where: { userId: user.id } });
      expect(after).toBe(before + 1);
    });

    it("returns 401 with generic message on wrong password", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: "WrongPass1!" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
      expect(getSetCookieHeader(res)).not.toContain(COOKIE_NAME + "=");
    });

    it("returns 401 with generic message on unknown email (same message, no probe)", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: "nobody@vigil.app", password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("returns 429 after exceeding rate limit attempts", async () => {
      const badPass = "WrongPass1!";
      let lastStatus = 0;

      for (let i = 0; i < 15; i++) {
        const res = await request(app.getHttpServer())
          .post("/api/auth/sign-in")
          .set("x-forwarded-for", "10.0.0.99")
          .send({ email: TEST_EMAIL, password: badPass });
        lastStatus = res.status;
        if (res.status === 429) break;
      }

      expect(lastStatus).toBe(429);
    });
  });

  describe("POST /api/auth/sign-out", () => {
    it("returns 200 and clears the session cookie", async () => {
      const signIn = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const cookie = getFirstSetCookie(signIn);

      const res = await request(app.getHttpServer())
        .post("/api/auth/sign-out")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      const setCookie = getSetCookieHeader(res);
      expect(setCookie).toContain(COOKIE_NAME);
      expect(setCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    });

    it("deletes the Session row so the cookie cannot be replayed", async () => {
      const signIn = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const cookie = getFirstSetCookie(signIn);

      await request(app.getHttpServer())
        .post("/api/auth/sign-out")
        .set("Cookie", cookie);

      const res = await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Cookie", cookie);

      expect(res.status).toBe(401);
    });

    it("returns 200 even when no session cookie is present", async () => {
      const res = await request(app.getHttpServer()).post("/api/auth/sign-out");
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns the authenticated user email", async () => {
      const signIn = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const cookie = getFirstSetCookie(signIn);

      const res = await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ email: TEST_EMAIL });
    });

    it("returns 401 with no cookie", async () => {
      const res = await request(app.getHttpServer()).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 401 with an invalid session cookie", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Cookie", `${COOKIE_NAME}=not-a-real-session`);

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/change-password", () => {
    const NEW_PASSWORD = "N3wStr0ng!Pass#99";

    it("returns 200 and updates the password", async () => {
      const signIn = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const cookie = getFirstSetCookie(signIn);

      const res = await request(app.getHttpServer())
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });

      expect(res.status).toBe(200);
    });

    it("keeps the current session valid after password change", async () => {
      const signIn = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const cookie = getFirstSetCookie(signIn);

      await request(app.getHttpServer())
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });

      const me = await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Cookie", cookie);

      expect(me.status).toBe(200);
    });

    it("invalidates other sessions after password change", async () => {
      const other = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
      const otherCookie = getFirstSetCookie(other);

      const current = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
      const currentCookie = getFirstSetCookie(current);

      await request(app.getHttpServer())
        .post("/api/auth/change-password")
        .set("Cookie", currentCookie)
        .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });

      const otherMe = await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Cookie", otherCookie);

      expect(otherMe.status).toBe(401);
    });

    it("returns 401 when current password is wrong", async () => {
      const signIn = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const cookie = getFirstSetCookie(signIn);

      const res = await request(app.getHttpServer())
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({ currentPassword: "WrongPass1!", newPassword: NEW_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("returns 422 when new password violates policy", async () => {
      const signIn = await request(app.getHttpServer())
        .post("/api/auth/sign-in")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const cookie = getFirstSetCookie(signIn);

      const res = await request(app.getHttpServer())
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({ currentPassword: TEST_PASSWORD, newPassword: "weak" });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty("errors");
    });

    it("returns 401 with no session cookie", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/auth/change-password")
        .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });

      expect(res.status).toBe(401);
    });
  });
});
