import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationConfigService } from "../notification/notification-config.service";
import { SNS_CLIENT, type ISnsClient } from "./sns-client.interface";

@Injectable()
export class NotificationSubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationConfig: NotificationConfigService,
    @Inject(SNS_CLIENT) private readonly snsClient: ISnsClient,
  ) {}

  async ensureEmailSubscription(userId: string, email: string): Promise<void> {
    if (!this.notificationConfig.isConfigured()) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailSubscriptionArn: true },
    });

    if (user?.emailSubscriptionArn) return;

    const topicArn = process.env["SNS_TOPIC_ARN"]!;
    const result = await this.snsClient.subscribe(topicArn, email, "email");

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailSubscriptionArn: result.subscriptionArn,
        emailSubscriptionStatus: "PendingConfirmation",
      },
    });
  }

  async refreshEmailStatus(userId: string): Promise<{ arn: string | null; status: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailSubscriptionArn: true, emailSubscriptionStatus: true },
    });

    if (!user?.emailSubscriptionArn) {
      return { arn: null, status: null };
    }

    const attrs = await this.snsClient.getSubscriptionAttributes(user.emailSubscriptionArn);
    const status = attrs?.status ?? null;

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailSubscriptionStatus: status },
    });

    return { arn: user.emailSubscriptionArn, status };
  }

  async isEmailConfirmed(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailSubscriptionStatus: true },
    });
    return user?.emailSubscriptionStatus === "Confirmed";
  }

  async getState(userId: string): Promise<{ arn: string | null; status: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailSubscriptionArn: true, emailSubscriptionStatus: true },
    });
    return {
      arn: user?.emailSubscriptionArn ?? null,
      status: user?.emailSubscriptionStatus ?? null,
    };
  }
}
