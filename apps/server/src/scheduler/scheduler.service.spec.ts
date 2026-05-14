import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SchedulerService } from "./scheduler.service";
import { PrismaService } from "../prisma/prisma.service";
import { ExecutorService } from "../executor/executor.service";
import { WatchRunService } from "../watch-run/watch-run.service";
import { RunStatus } from "../watch-run/watch-run.types";

const makeWatch = (overrides: Record<string, unknown> = {}) => ({
  id: "watch-1",
  userId: "user-A",
  targetUrl: "https://example.com",
  responseType: "HTML",
  extractorExpression: "h1",
  conditionOperator: "EQUALS",
  expectedValue: "hello",
  scheduleExpression: "*/5 * * * *",
  ...overrides,
});

describe("SchedulerService (unit)", () => {
  let service: SchedulerService;
  let mockPrisma: {
    watch: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; findUniqueOrThrow: ReturnType<typeof vi.fn> };
    watchRun: { findFirst: ReturnType<typeof vi.fn> };
  };
  let mockExecutor: { execute: ReturnType<typeof vi.fn> };
  let mockWatchRunService: { recordRun: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});
    vi.spyOn(Logger.prototype, "log").mockImplementation(() => {});

    mockPrisma = {
      watch: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
      },
      watchRun: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    mockExecutor = {
      execute: vi.fn().mockResolvedValue({ extractedValue: "hello", conditionMet: true, error: null }),
    };
    mockWatchRunService = {
      recordRun: vi.fn().mockResolvedValue({ id: "run-1", status: RunStatus.PASS }),
    };
    service = new SchedulerService(
      mockPrisma as unknown as PrismaService,
      mockExecutor as unknown as ExecutorService,
      mockWatchRunService as unknown as WatchRunService,
    );
  });

  describe("executeIfOwned — tenant safety", () => {
    it("skips execution when job userId does not match watch userId", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch({ userId: "user-A" }));

      await (service as unknown as { executeIfOwned(id: string, uid: string | null): Promise<void> })
        .executeIfOwned("watch-1", "user-B");

      expect(mockExecutor.execute).not.toHaveBeenCalled();
      expect(mockWatchRunService.recordRun).not.toHaveBeenCalled();
    });

    it("executes when job userId matches watch userId", async () => {
      const watch = makeWatch({ userId: "user-A" });
      mockPrisma.watch.findUnique.mockResolvedValue(watch);
      mockPrisma.watch.findUniqueOrThrow.mockResolvedValue(watch);

      await (service as unknown as { executeIfOwned(id: string, uid: string | null): Promise<void> })
        .executeIfOwned("watch-1", "user-A");

      expect(mockExecutor.execute).toHaveBeenCalled();
      expect(mockWatchRunService.recordRun).toHaveBeenCalled();
    });

    it("executes a legacy watch (userId null) when job carries null userId", async () => {
      const watch = makeWatch({ userId: null });
      mockPrisma.watch.findUnique.mockResolvedValue(watch);
      mockPrisma.watch.findUniqueOrThrow.mockResolvedValue(watch);

      await (service as unknown as { executeIfOwned(id: string, uid: string | null): Promise<void> })
        .executeIfOwned("watch-1", null);

      expect(mockExecutor.execute).toHaveBeenCalled();
    });

    it("skips execution when watch is not found", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(null);

      await (service as unknown as { executeIfOwned(id: string, uid: string | null): Promise<void> })
        .executeIfOwned("nonexistent-watch", "user-A");

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });
  });
});
