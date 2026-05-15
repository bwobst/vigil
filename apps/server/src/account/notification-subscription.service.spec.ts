import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationSubscriptionService } from "./notification-subscription.service";
import { NotificationConfigService } from "../notification/notification-config.service";
import { PrismaService } from "../prisma/prisma.service";
import type { ISnsClient } from "./sns-client.interface";

const USER_ID = "user-1";
const USER_EMAIL = "user@example.com";
const TOPIC_ARN = "arn:aws:sns:us-west-2:123456789012:vigil-alerts";
const SUB_ARN = "arn:aws:sns:us-west-2:123456789012:vigil-alerts:abc123";

function makeService(overrides: {
  userRecord?: Record<string, unknown> | null;
  isConfigured?: boolean;
  snsClient?: Partial<ISnsClient>;
}) {
  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue(
        overrides.userRecord !== undefined ? overrides.userRecord : { emailSubscriptionArn: null, emailSubscriptionStatus: null },
      ),
      update: vi.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaService;

  const notificationConfig = {
    isConfigured: vi.fn().mockReturnValue(overrides.isConfigured ?? false),
  } as unknown as NotificationConfigService;

  const snsClient: ISnsClient = {
    subscribe: vi.fn().mockResolvedValue({ subscriptionArn: SUB_ARN }),
    getSubscriptionAttributes: vi.fn().mockResolvedValue({ status: "PendingConfirmation" }),
    ...overrides.snsClient,
  };

  const service = new NotificationSubscriptionService(prisma, notificationConfig, snsClient);
  return { service, prisma, notificationConfig, snsClient };
}

describe("NotificationSubscriptionService", () => {
  beforeEach(() => {
    vi.stubEnv("SNS_TOPIC_ARN", TOPIC_ARN);
  });

  describe("ensureEmailSubscription", () => {
    it("does nothing when notifications are not configured", async () => {
      const { service, snsClient } = makeService({ isConfigured: false });
      await service.ensureEmailSubscription(USER_ID, USER_EMAIL);
      expect(snsClient.subscribe).not.toHaveBeenCalled();
    });

    it("does nothing when user already has a subscription ARN", async () => {
      const { service, snsClient } = makeService({
        isConfigured: true,
        userRecord: { emailSubscriptionArn: SUB_ARN },
      });
      await service.ensureEmailSubscription(USER_ID, USER_EMAIL);
      expect(snsClient.subscribe).not.toHaveBeenCalled();
    });

    it("subscribes and saves ARN when SNS configured and no ARN stored", async () => {
      const { service, prisma, snsClient } = makeService({
        isConfigured: true,
        userRecord: { emailSubscriptionArn: null },
      });
      await service.ensureEmailSubscription(USER_ID, USER_EMAIL);
      expect(snsClient.subscribe).toHaveBeenCalledWith(TOPIC_ARN, USER_EMAIL, "email");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { emailSubscriptionArn: SUB_ARN, emailSubscriptionStatus: "PendingConfirmation" },
      });
    });
  });

  describe("refreshEmailStatus", () => {
    it("returns null state when user has no subscription ARN", async () => {
      const { service } = makeService({ userRecord: { emailSubscriptionArn: null, emailSubscriptionStatus: null } });
      const result = await service.refreshEmailStatus(USER_ID);
      expect(result).toEqual({ arn: null, status: null });
    });

    it("calls getSubscriptionAttributes and updates DB with returned status", async () => {
      const { service, prisma } = makeService({
        userRecord: { emailSubscriptionArn: SUB_ARN, emailSubscriptionStatus: "PendingConfirmation" },
        snsClient: { getSubscriptionAttributes: vi.fn().mockResolvedValue({ status: "Confirmed" }) },
      });
      const result = await service.refreshEmailStatus(USER_ID);
      expect(result).toEqual({ arn: SUB_ARN, status: "Confirmed" });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { emailSubscriptionStatus: "Confirmed" },
      });
    });

    it("updates DB with null status when getSubscriptionAttributes returns null", async () => {
      const { service, prisma } = makeService({
        userRecord: { emailSubscriptionArn: SUB_ARN, emailSubscriptionStatus: "PendingConfirmation" },
        snsClient: { getSubscriptionAttributes: vi.fn().mockResolvedValue(null) },
      });
      const result = await service.refreshEmailStatus(USER_ID);
      expect(result).toEqual({ arn: SUB_ARN, status: null });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { emailSubscriptionStatus: null },
      });
    });
  });

  describe("isEmailConfirmed", () => {
    it("returns false when subscription status is PendingConfirmation", async () => {
      const { service } = makeService({ userRecord: { emailSubscriptionStatus: "PendingConfirmation" } });
      expect(await service.isEmailConfirmed(USER_ID)).toBe(false);
    });

    it("returns true when subscription status is Confirmed", async () => {
      const { service } = makeService({ userRecord: { emailSubscriptionStatus: "Confirmed" } });
      expect(await service.isEmailConfirmed(USER_ID)).toBe(true);
    });

    it("returns false when subscription status is null", async () => {
      const { service } = makeService({ userRecord: { emailSubscriptionStatus: null } });
      expect(await service.isEmailConfirmed(USER_ID)).toBe(false);
    });
  });

  describe("getState", () => {
    it("returns arn and status from user record", async () => {
      const { service } = makeService({
        userRecord: { emailSubscriptionArn: SUB_ARN, emailSubscriptionStatus: "Confirmed" },
      });
      const result = await service.getState(USER_ID);
      expect(result).toEqual({ arn: SUB_ARN, status: "Confirmed" });
    });

    it("returns null arn and status when user has no subscription", async () => {
      const { service } = makeService({ userRecord: { emailSubscriptionArn: null, emailSubscriptionStatus: null } });
      const result = await service.getState(USER_ID);
      expect(result).toEqual({ arn: null, status: null });
    });
  });
});
