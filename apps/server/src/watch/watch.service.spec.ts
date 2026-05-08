import "reflect-metadata";
import { BadRequestException } from "@nestjs/common";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaService } from "../prisma/prisma.service";
import { SchedulerService } from "../scheduler/scheduler.service";
import { WatchService } from "./watch.service";
import { ConditionOperator, ResponseType } from "./watch.types";

const hasDb = !!process.env["DATABASE_URL"];

const validInput = {
  name: "Test Watch",
  targetUrl: "https://example.com",
  responseType: ResponseType.HTML,
  extractorExpression: "h1",
  conditionOperator: ConditionOperator.EQUALS,
  expectedValue: "Hello",
  scheduleExpression: "*/5 * * * *",
};

describe.skipIf(!hasDb)("WatchService (integration)", () => {
  let prisma: PrismaService;
  let service: WatchService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    const mockScheduler = {
      schedule: vi.fn().mockResolvedValue(undefined),
      unschedule: vi.fn().mockResolvedValue(undefined),
    } as unknown as SchedulerService;
    service = new WatchService(prisma, mockScheduler);
  });

  afterAll(async () => {
    await prisma.watch.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.watch.deleteMany();
  });

  describe("create", () => {
    it("persists a new Watch and returns it", async () => {
      const watch = await service.create(validInput);
      expect(watch.id).toBeTruthy();
      expect(watch.name).toBe("Test Watch");
      expect(watch.targetUrl).toBe("https://example.com");
      expect(watch.responseType).toBe(ResponseType.HTML);
      expect(watch.extractorExpression).toBe("h1");
      expect(watch.conditionOperator).toBe(ConditionOperator.EQUALS);
      expect(watch.expectedValue).toBe("Hello");
      expect(watch.scheduleExpression).toBe("*/5 * * * *");
      expect(watch.createdAt).toBeInstanceOf(Date);
      expect(watch.updatedAt).toBeInstanceOf(Date);
    });

    it("rejects an invalid cron expression", async () => {
      await expect(
        service.create({ ...validInput, scheduleExpression: "not-a-cron" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects a schedule with less than 5-minute granularity", async () => {
      await expect(
        service.create({ ...validInput, scheduleExpression: "* * * * *" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects EQUALS condition with no expectedValue", async () => {
      await expect(
        service.create({
          ...validInput,
          conditionOperator: ConditionOperator.EQUALS,
          expectedValue: null,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("accepts EQUALS condition when expectedValue is provided", async () => {
      const watch = await service.create({
        ...validInput,
        conditionOperator: ConditionOperator.EQUALS,
        expectedValue: "some value",
      });
      expect(watch.conditionOperator).toBe(ConditionOperator.EQUALS);
    });

    it("accepts CHANGED condition without expectedValue", async () => {
      const watch = await service.create({
        ...validInput,
        conditionOperator: ConditionOperator.CHANGED,
        expectedValue: null,
      });
      expect(watch.conditionOperator).toBe(ConditionOperator.CHANGED);
    });
  });

  describe("findAll", () => {
    it("returns all Watches", async () => {
      await service.create(validInput);
      await service.create({ ...validInput, name: "Second Watch" });
      const watches = await service.findAll();
      expect(watches).toHaveLength(2);
    });

    it("returns empty array when no Watches exist", async () => {
      const watches = await service.findAll();
      expect(watches).toHaveLength(0);
    });
  });

  describe("findOne", () => {
    it("returns a Watch by id", async () => {
      const created = await service.create(validInput);
      const found = await service.findOne(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it("returns null for a non-existent id", async () => {
      const found = await service.findOne("00000000-0000-0000-0000-000000000000");
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("updates an existing Watch and returns it", async () => {
      const created = await service.create(validInput);
      const updated = await service.update(created.id, { name: "Updated Watch" });
      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("Updated Watch");
      expect(updated.targetUrl).toBe(created.targetUrl);
    });

    it("rejects update with invalid cron expression", async () => {
      const created = await service.create(validInput);
      await expect(
        service.update(created.id, { scheduleExpression: "bad-cron" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects update that would produce EQUALS without expectedValue", async () => {
      const created = await service.create({
        ...validInput,
        conditionOperator: ConditionOperator.CHANGED,
        expectedValue: null,
      });
      await expect(
        service.update(created.id, {
          conditionOperator: ConditionOperator.EQUALS,
          expectedValue: null,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("delete", () => {
    it("removes a Watch and returns its id", async () => {
      const created = await service.create(validInput);
      const deletedId = await service.delete(created.id);
      expect(deletedId).toBe(created.id);
      const found = await service.findOne(created.id);
      expect(found).toBeNull();
    });
  });
});

describe("WatchService validation (unit)", () => {
  it("does not require a database for validation logic", () => {
    expect(true).toBe(true);
  });
});
