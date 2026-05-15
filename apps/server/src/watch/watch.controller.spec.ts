import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { hashPassword } from "../password/password-hash";
import { MailConfigModule } from "../mail/mail-config.module";
import { WatchModule } from "./watch.module";

const hasDb = !!process.env["DATABASE_URL"];

const USER_A_EMAIL = "watch-ctrl-a@vigil.app";
const USER_B_EMAIL = "watch-ctrl-b@vigil.app";
const TEST_PASSWORD = "Str0ng!Pass#12";
const COOKIE_NAME = "vigil_session";

const validWatch = {
  name: "Test Watch",
  targetUrl: "https://example.com",
  responseType: "HTML",
  extractorExpression: "h1",
  conditionOperator: "EQUALS",
  expectedValue: "Hello",
  scheduleExpression: "*/5 * * * *",
};

function getSessionCookie(res: request.Response): string {
  const raw = res.headers["set-cookie"] as string | string[] | undefined;
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0] ?? "") : raw;
}

describe.skipIf(!hasDb)("Watch HTTP API (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieA: string;
  let cookieB: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, MailConfigModule, WatchModule],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.watch.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } });
    await app.close();
  });

  beforeEach(async () => {
    await prisma.watch.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } });

    const hashed = await hashPassword(TEST_PASSWORD);
    await prisma.user.createMany({
      data: [
        { email: USER_A_EMAIL, password: hashed },
        { email: USER_B_EMAIL, password: hashed },
      ],
    });

    const signInA = await request(app.getHttpServer())
      .post("/api/auth/sign-in")
      .send({ email: USER_A_EMAIL, password: TEST_PASSWORD });
    cookieA = getSessionCookie(signInA);

    const signInB = await request(app.getHttpServer())
      .post("/api/auth/sign-in")
      .send({ email: USER_B_EMAIL, password: TEST_PASSWORD });
    cookieB = getSessionCookie(signInB);
  });

  afterEach(async () => {
    await prisma.watch.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } });
  });

  describe("GET /api/watches", () => {
    it("returns 401 without a session", async () => {
      const res = await request(app.getHttpServer()).get("/api/watches");
      expect(res.status).toBe(401);
    });

    it("returns only the authenticated user's watches", async () => {
      await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send({ ...validWatch, name: "Watch A" });

      await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieB)
        .send({ ...validWatch, name: "Watch B" });

      const res = await request(app.getHttpServer())
        .get("/api/watches")
        .set("Cookie", cookieA);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Watch A");
    });
  });

  describe("POST /api/watches", () => {
    it("returns 401 without a session", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/watches")
        .send(validWatch);
      expect(res.status).toBe(401);
    });

    it("creates a watch owned by the authenticated user", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Watch");

      const user = await prisma.user.findUniqueOrThrow({ where: { email: USER_A_EMAIL } });
      expect(res.body.userId).toBe(user.id);
    });
  });

  describe("notifyEmail and mailReady", () => {
    it("creates a watch with notifyEmail defaulting to false", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      expect(res.status).toBe(201);
      expect(res.body.notifyEmail).toBe(false);
    });

    it("creates a watch with notifyEmail true when provided", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send({ ...validWatch, notifyEmail: true });

      expect(res.status).toBe(201);
      expect(res.body.notifyEmail).toBe(true);
    });

    it("PATCH persists notifyEmail toggle", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const updated = await request(app.getHttpServer())
        .patch(`/api/watches/${created.body.id}`)
        .set("Cookie", cookieA)
        .send({ notifyEmail: true });

      expect(updated.status).toBe(200);
      expect(updated.body.notifyEmail).toBe(true);

      const toggled = await request(app.getHttpServer())
        .patch(`/api/watches/${created.body.id}`)
        .set("Cookie", cookieA)
        .send({ notifyEmail: false });

      expect(toggled.status).toBe(200);
      expect(toggled.body.notifyEmail).toBe(false);
    });

    it("GET /api/watches includes mailReady in each watch", async () => {
      await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .get("/api/watches")
        .set("Cookie", cookieA);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(typeof res.body[0].mailReady).toBe("boolean");
    });

    it("GET /api/watches/:id includes mailReady", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .get(`/api/watches/${created.body.id}`)
        .set("Cookie", cookieA);

      expect(res.status).toBe(200);
      expect(typeof res.body.mailReady).toBe("boolean");
    });

    it("mailReady is false when SMTP_HOST/MAIL_FROM not set", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .get(`/api/watches/${created.body.id}`)
        .set("Cookie", cookieA);

      expect(res.body.mailReady).toBe(false);
    });
  });

  describe("GET /api/watches/:id", () => {
    it("returns 401 without a session", async () => {
      const res = await request(app.getHttpServer()).get("/api/watches/some-id");
      expect(res.status).toBe(401);
    });

    it("returns 200 for the owning user", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .get(`/api/watches/${created.body.id}`)
        .set("Cookie", cookieA);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });

    it("returns 404 for another user's watch", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .get(`/api/watches/${created.body.id}`)
        .set("Cookie", cookieB);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/watches/:id", () => {
    it("returns 401 without a session", async () => {
      const res = await request(app.getHttpServer())
        .patch("/api/watches/some-id")
        .send({ name: "New Name" });
      expect(res.status).toBe(401);
    });

    it("updates the watch for the owning user", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .patch(`/api/watches/${created.body.id}`)
        .set("Cookie", cookieA)
        .send({ name: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated");
    });

    it("returns 404 when updating another user's watch", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .patch(`/api/watches/${created.body.id}`)
        .set("Cookie", cookieB)
        .send({ name: "Hacked" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/watches/:id", () => {
    it("returns 401 without a session", async () => {
      const res = await request(app.getHttpServer()).delete("/api/watches/some-id");
      expect(res.status).toBe(401);
    });

    it("deletes the watch for the owning user", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .delete(`/api/watches/${created.body.id}`)
        .set("Cookie", cookieA);

      expect(res.status).toBe(204);
    });

    it("returns 404 when deleting another user's watch", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .delete(`/api/watches/${created.body.id}`)
        .set("Cookie", cookieB);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/watches/:id/run", () => {
    it("returns 401 without a session", async () => {
      const res = await request(app.getHttpServer()).post("/api/watches/some-id/run");
      expect(res.status).toBe(401);
    });

    it("returns 404 for another user's watch", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .post(`/api/watches/${created.body.id}/run`)
        .set("Cookie", cookieB);

      expect(res.status).toBe(404);
    });

    it("returns 202 for the owning user", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .post(`/api/watches/${created.body.id}/run`)
        .set("Cookie", cookieA);

      expect(res.status).toBe(202);
    });
  });

  describe("GET /api/watches/:id/runs", () => {
    it("returns 401 without a session", async () => {
      const res = await request(app.getHttpServer()).get("/api/watches/some-id/runs");
      expect(res.status).toBe(401);
    });

    it("returns 404 for another user's watch", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .get(`/api/watches/${created.body.id}/runs`)
        .set("Cookie", cookieB);

      expect(res.status).toBe(404);
    });

    it("returns { runs, totalCount } for the owning user", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .get(`/api/watches/${created.body.id}/runs`)
        .set("Cookie", cookieA);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.runs)).toBe(true);
      expect(typeof res.body.totalCount).toBe("number");
    });

    it("defaults to page 1 when no page param given", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .get(`/api/watches/${created.body.id}/runs`)
        .set("Cookie", cookieA);

      expect(res.status).toBe(200);
      expect(res.body.runs).toHaveLength(0);
      expect(res.body.totalCount).toBe(0);
    });

    it("returns empty runs with correct totalCount for a page beyond the last", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const res = await request(app.getHttpServer())
        .get(`/api/watches/${created.body.id}/runs?page=99`)
        .set("Cookie", cookieA);

      expect(res.status).toBe(200);
      expect(res.body.runs).toHaveLength(0);
      expect(res.body.totalCount).toBe(0);
    });

    it("normalizes page < 1 to page 1", async () => {
      const created = await request(app.getHttpServer())
        .post("/api/watches")
        .set("Cookie", cookieA)
        .send(validWatch);

      const resNeg = await request(app.getHttpServer())
        .get(`/api/watches/${created.body.id}/runs?page=0`)
        .set("Cookie", cookieA);
      expect(resNeg.status).toBe(200);
      expect(resNeg.body.totalCount).toBe(0);

      const resNaN = await request(app.getHttpServer())
        .get(`/api/watches/${created.body.id}/runs?page=abc`)
        .set("Cookie", cookieA);
      expect(resNaN.status).toBe(200);
      expect(resNaN.body.totalCount).toBe(0);
    });
  });
});
