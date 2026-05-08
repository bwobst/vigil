import "reflect-metadata";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaService } from "../prisma/prisma.service";
import { WatchRunService } from "./watch-run.service";
import { RunStatus } from "./watch-run.types";
import { ResponseType, ConditionOperator } from "../watch/watch.dto";

const hasDb = !!process.env["DATABASE_URL"];

const watchSeed = {
  name: "Test Watch",
  targetUrl: "https://example.com",
  responseType: ResponseType.HTML,
  extractorExpression: "h1",
  conditionOperator: ConditionOperator.EQUALS,
  expectedValue: "Hello",
  scheduleExpression: "*/5 * * * *",
};

function makeRunInput(watchId: string, overrides: Partial<{
  startedAt: Date;
  completedAt: Date;
  status: RunStatus;
  extractedValue: string | null;
  conditionMet: boolean | null;
  error: string | null;
}> = {}) {
  const startedAt = overrides.startedAt ?? new Date();
  const completedAt = overrides.completedAt ?? new Date(startedAt.getTime() + 1000);
  return {
    watchId,
    startedAt,
    completedAt,
    status: RunStatus.PASS,
    extractedValue: "Hello",
    conditionMet: true,
    error: null,
    ...overrides,
  };
}

describe.skipIf(!hasDb)("WatchRunService (integration)", () => {
  let prisma: PrismaService;
  let service: WatchRunService;
  let watchId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    service = new WatchRunService(prisma);
    const watch = await prisma.watch.create({ data: watchSeed });
    watchId = watch.id;
  });

  afterAll(async () => {
    await prisma.watchRun.deleteMany();
    await prisma.watch.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.watchRun.deleteMany();
  });

  describe("recordRun", () => {
    it("persists a PASS run and returns it", async () => {
      const run = await service.recordRun(makeRunInput(watchId, {
        status: RunStatus.PASS,
        extractedValue: "42",
        conditionMet: true,
        error: null,
      }));
      expect(run.id).toBeTruthy();
      expect(run.watchId).toBe(watchId);
      expect(run.status).toBe(RunStatus.PASS);
      expect(run.extractedValue).toBe("42");
      expect(run.conditionMet).toBe(true);
      expect(run.error).toBeNull();
    });

    it("persists a FAIL run and returns it", async () => {
      const run = await service.recordRun(makeRunInput(watchId, {
        status: RunStatus.FAIL,
        extractedValue: "99",
        conditionMet: false,
        error: null,
      }));
      expect(run.status).toBe(RunStatus.FAIL);
      expect(run.conditionMet).toBe(false);
    });

    it("persists an ERROR run with null extractedValue and conditionMet", async () => {
      const run = await service.recordRun(makeRunInput(watchId, {
        status: RunStatus.ERROR,
        extractedValue: null,
        conditionMet: null,
        error: "Connection refused",
      }));
      expect(run.status).toBe(RunStatus.ERROR);
      expect(run.extractedValue).toBeNull();
      expect(run.conditionMet).toBeNull();
      expect(run.error).toBe("Connection refused");
    });
  });

  describe("findByWatch", () => {
    it("returns all runs for a Watch ordered by startedAt descending", async () => {
      const t0 = new Date("2026-01-01T00:00:00Z");
      const t1 = new Date("2026-01-01T00:05:00Z");
      const t2 = new Date("2026-01-01T00:10:00Z");
      await service.recordRun(makeRunInput(watchId, { startedAt: t0, completedAt: new Date(t0.getTime() + 1000) }));
      await service.recordRun(makeRunInput(watchId, { startedAt: t2, completedAt: new Date(t2.getTime() + 1000) }));
      await service.recordRun(makeRunInput(watchId, { startedAt: t1, completedAt: new Date(t1.getTime() + 1000) }));

      const runs = await service.findByWatch(watchId);
      expect(runs).toHaveLength(3);
      expect(runs[0]!.startedAt).toEqual(t2);
      expect(runs[1]!.startedAt).toEqual(t1);
      expect(runs[2]!.startedAt).toEqual(t0);
    });

    it("returns empty array when Watch has no runs", async () => {
      const runs = await service.findByWatch(watchId);
      expect(runs).toHaveLength(0);
    });
  });

  describe("findOne", () => {
    it("returns a WatchRun by id", async () => {
      const created = await service.recordRun(makeRunInput(watchId));
      const found = await service.findOne(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it("returns null for a non-existent id", async () => {
      const found = await service.findOne("00000000-0000-0000-0000-000000000000");
      expect(found).toBeNull();
    });
  });
});
