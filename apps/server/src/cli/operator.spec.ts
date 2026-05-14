import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeEmail } from "../password/password-policy";
import { hashPassword, verifyPassword } from "../password/password-hash";

const hasDb = !!process.env["DATABASE_URL"];

describe.skipIf(!hasDb)("Operator provisioning (integration)", () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("create-user", () => {
    it("stores a normalized email and hashed password", async () => {
      const email = "  Admin@Vigil.App  ";
      const password = "Str0ng!Pass#12";
      const normalized = normalizeEmail(email);
      const hashed = await hashPassword(password);

      const user = await prisma.user.create({
        data: { email: normalized, password: hashed },
      });

      expect(user.email).toBe("admin@vigil.app");
      const valid = await verifyPassword(user.password, password);
      expect(valid).toBe(true);
    });

    it("rejects duplicate normalized email", async () => {
      const email = "admin@vigil.app";
      const hashed = await hashPassword("Str0ng!Pass#12");
      await prisma.user.create({ data: { email, password: hashed } });

      await expect(
        prisma.user.create({ data: { email, password: hashed } }),
      ).rejects.toThrow();
    });
  });

  describe("reset-password", () => {
    it("updates password hash and invalidates all sessions", async () => {
      const hashed = await hashPassword("Str0ng!Pass#12");
      const user = await prisma.user.create({
        data: { email: "admin@vigil.app", password: hashed },
      });

      await prisma.session.createMany({
        data: [
          { userId: user.id },
          { userId: user.id },
        ],
      });

      const sessionsBefore = await prisma.session.count({ where: { userId: user.id } });
      expect(sessionsBefore).toBe(2);

      const newHash = await hashPassword("NewStr0ng!Pass#99");
      await prisma.$transaction([
        prisma.session.deleteMany({ where: { userId: user.id } }),
        prisma.user.update({ where: { id: user.id }, data: { password: newHash } }),
      ]);

      const sessionsAfter = await prisma.session.count({ where: { userId: user.id } });
      expect(sessionsAfter).toBe(0);

      const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      const oldValid = await verifyPassword(updated.password, "Str0ng!Pass#12");
      const newValid = await verifyPassword(updated.password, "NewStr0ng!Pass#99");
      expect(oldValid).toBe(false);
      expect(newValid).toBe(true);
    });
  });
});
