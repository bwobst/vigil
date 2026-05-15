import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MailQueueService } from "./mail-queue.service";
import { MailConfigService } from "./mail-config.service";
import { MailComposer } from "./mail-composer";
import { PrismaService } from "../prisma/prisma.service";

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

describe("MailQueueService", () => {
  let service: MailQueueService;
  let mockPrisma: {
    watch: { findUnique: ReturnType<typeof vi.fn> };
    watchRun: { findUnique: ReturnType<typeof vi.fn> };
  };
  let mockMailConfig: { isConfigured: ReturnType<typeof vi.fn>; getSmtpConfig: ReturnType<typeof vi.fn> };
  let mockComposer: { compose: ReturnType<typeof vi.fn> };
  let mockSendMail: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});

    mockPrisma = {
      watch: { findUnique: vi.fn() },
      watchRun: { findUnique: vi.fn() },
    };
    mockMailConfig = {
      isConfigured: vi.fn().mockReturnValue(true),
      getSmtpConfig: vi.fn().mockReturnValue({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        from: "alerts@example.com",
      }),
    };
    mockComposer = {
      compose: vi.fn().mockReturnValue({
        to: "user@example.com",
        subject: "Test subject",
        text: "Test body",
      }),
    };
    mockSendMail = vi.fn().mockResolvedValue(undefined);

    service = new MailQueueService(
      mockPrisma as unknown as PrismaService,
      mockMailConfig as unknown as MailConfigService,
      mockComposer as unknown as MailComposer,
    );

    // Inject a fake sendMail so tests don't need real SMTP
    (service as unknown as { sendMail: typeof mockSendMail }).sendMail = mockSendMail;
  });

  describe("enqueueNotification", () => {
    it("does nothing when boss is not initialized (no DATABASE_URL)", async () => {
      // boss is null when DATABASE_URL is absent (service not started)
      await expect(
        service.enqueueNotification("watch-1", "run-1", "CONDITION_MET"),
      ).resolves.toBeUndefined();
    });
  });

  describe("handleJob (skip paths and happy path)", () => {
    const callHandle = (data: { watchId: string; runId: string; edgeType: string }) =>
      (service as unknown as { handleJob(data: { watchId: string; runId: string; edgeType: string }): Promise<void> })
        .handleJob(data);

    it("skips and logs when watch is deleted", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(null);
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(mockSendMail).not.toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalled();
    });

    it("skips when notifyEmail is false", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch({ notifyEmail: false }));
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(mockSendMail).not.toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalled();
    });

    it("skips when watch has no user (userId null)", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch({ user: null }));
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(mockSendMail).not.toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });

    it("skips when watch run is not found", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch());
      mockPrisma.watchRun.findUnique.mockResolvedValue(null);
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(mockSendMail).not.toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalled();
    });

    it("sends email when all checks pass (CONDITION_MET)", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch());
      mockPrisma.watchRun.findUnique.mockResolvedValue(makeRun());
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(mockComposer.compose).toHaveBeenCalledWith(
        "CONDITION_MET",
        expect.objectContaining({ id: "watch-1" }),
        expect.objectContaining({ id: "run-1" }),
        expect.objectContaining({ email: "user@example.com" }),
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: "user@example.com", subject: "Test subject" }),
      );
    });

    it("sends email for EXECUTION_ERROR edge", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch());
      mockPrisma.watchRun.findUnique.mockResolvedValue(makeRun({ status: "ERROR", conditionMet: null, error: "Timeout" }));
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "EXECUTION_ERROR" });
      expect(mockComposer.compose).toHaveBeenCalledWith(
        "EXECUTION_ERROR",
        expect.any(Object),
        expect.any(Object),
        expect.any(Object),
      );
      expect(mockSendMail).toHaveBeenCalled();
    });

    it("logs success after sending", async () => {
      mockPrisma.watch.findUnique.mockResolvedValue(makeWatch());
      mockPrisma.watchRun.findUnique.mockResolvedValue(makeRun());
      await callHandle({ watchId: "watch-1", runId: "run-1", edgeType: "CONDITION_MET" });
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining("watch-1"),
      );
    });
  });
});
