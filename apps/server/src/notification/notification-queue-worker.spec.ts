import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationQueueWorker } from "./notification-queue-worker";
import { NotificationComposer } from "./notification-composer";
import { PrismaService } from "../prisma/prisma.service";
import type { INotificationPublisher } from "./notification-publisher.interface";

const makeWatch = (overrides: Record<string, unknown> = {}) => ({
  id: "watch-1",
  name: "Test Watch",
  notifyEmail: true,
  user: { id: "user-1", email: "user@example.com" },
  ...overrides,
});

const makeRun = (overrides: Record<string, unknown> = {}) => ({
  id: "run-1",
  watchId: "watch-1",
  startedAt: new Date("2026-05-15T10:00:00Z"),
  extractedValue: "42",
  conditionMet: true,
  error: null,
  status: "PASS",
  ...overrides,
});

describe("NotificationQueueWorker", () => {
  let worker: NotificationQueueWorker;
  let mockPrisma: {
    watch: { findUnique: ReturnType<typeof vi.fn> };
    watchRun: { findUnique: ReturnType<typeof vi.fn> };
  };
  let mockComposer: { compose: ReturnType<typeof vi.fn> };
  let mockPublisher: INotificationPublisher;

  beforeEach(() => {
    vi.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});

    mockPrisma = {
      watch: { findUnique: vi.fn() },
      watchRun: { findUnique: vi.fn() },
    };
    mockComposer = {
      compose: vi.fn().mockReturnValue({
        to: "user@example.com",
        subject: "Test subject",
        text: "Test body",
      }),
    };
    mockPublisher = { publish: vi.fn().mockResolvedValue(undefined) };

    worker = new NotificationQueueWorker(
      mockPrisma as unknown as PrismaService,
      mockComposer as unknown as NotificationComposer,
      mockPublisher,
    );
  });

  describe("enqueueNotification", () => {
    it("does nothing when boss is not initialized (no DATABASE_URL)", async () => {
      await expect(
        worker.enqueueNotification("watch-1", "run-1", "CONDITION_MET"),
      ).resolves.toBeUndefined();
    });
  });

  describe("handleJob (skip paths and happy path)", () => {
    const callHandle = (data: { watchId: string; runId: string; edgeType: string }) =>
      (worker as unknown as { handleJob(data: { watchId: string; runId: string; edgeType: string }): Promise<void> })
        .handleJob(data);

    it("skips and logs when watch is deleted", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(null);
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(mockPublisher.publish).not.toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalled();
    });

    it("skips when notifyEmail is false", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch({ notifyEmail: false }));
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(mockPublisher.publish).not.toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalled();
    });

    it("skips when watch has no user (userId null)", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch({ user: null }));
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(mockPublisher.publish).not.toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });

    it("skips when watch run is not found", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch());
      mockPrisma.watchRun.findUnique.mockResolvedValue(null);
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(mockPublisher.publish).not.toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalled();
    });

    it("publishes notification when all checks pass (CONDITION_MET)", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch());
      mockPrisma.watchRun.findUnique.mockResolvedValue(makeRun());
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(mockComposer.compose).toHaveBeenCalledWith(
        "CONDITION_MET",
        expect.objectContaining({ id: "watch-1" }),
        expect.objectContaining({ id: "run-1" }),
        expect.objectContaining({ email: "user@example.com" }),
      );
      expect(mockPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({ to: "user@example.com", subject: "Test subject" }),
      );
    });

    it("publishes notification for EXECUTION_ERROR edge", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch());
      mockPrisma.watchRun.findUnique.mockResolvedValue(makeRun({ status: "ERROR", conditionMet: null, error: "Timeout" }));
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "EXECUTION_ERROR" });
      expect(mockComposer.compose).toHaveBeenCalledWith(
        "EXECUTION_ERROR",
        expect.any(Object),
        expect.any(Object),
        expect.any(Object),
      );
      expect(mockPublisher.publish).toHaveBeenCalled();
    });

    it("logs success after publishing", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch());
      mockPrisma.watchRun.findUnique.mockResolvedValue(makeRun());
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining("watch-1"),
      );
    });
  });
});
