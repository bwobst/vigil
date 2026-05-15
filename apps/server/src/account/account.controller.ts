import { Body, Controller, Get, HttpCode, Patch, Post, Req, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService, SESSION_COOKIE } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationSubscriptionService } from "./notification-subscription.service";
import { UpdateNotificationsDto, type AccountNotificationsResponse } from "./account.dto";

@Controller("account")
export class AccountController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly subscriptionService: NotificationSubscriptionService,
  ) {}

  private async requireUser(req: Request) {
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!sessionId) throw new UnauthorizedException();
    const user = await this.authService.getMe(sessionId);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  @Get("notifications")
  async getNotifications(@Req() req: Request): Promise<AccountNotificationsResponse> {
    const user = await this.requireUser(req);

    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { email: true, emailSubscriptionStatus: true, phone: true },
    });

    return {
      email: record.email,
      emailSubscriptionStatus: record.emailSubscriptionStatus,
      phone: record.phone,
    };
  }

  @Patch("notifications")
  async updateNotifications(
    @Req() req: Request,
    @Body() dto: UpdateNotificationsDto,
  ): Promise<AccountNotificationsResponse> {
    const user = await this.requireUser(req);

    if (dto.phone !== undefined) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { phone: dto.phone },
      });
    }

    await this.subscriptionService.ensureEmailSubscription(user.id, user.email);

    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { email: true, emailSubscriptionStatus: true, phone: true },
    });

    return {
      email: record.email,
      emailSubscriptionStatus: record.emailSubscriptionStatus,
      phone: record.phone,
    };
  }

  @Post("notifications/refresh")
  @HttpCode(200)
  async refreshNotifications(@Req() req: Request): Promise<AccountNotificationsResponse> {
    const user = await this.requireUser(req);

    await this.subscriptionService.refreshEmailStatus(user.id);

    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { email: true, emailSubscriptionStatus: true, phone: true },
    });

    return {
      email: record.email,
      emailSubscriptionStatus: record.emailSubscriptionStatus,
      phone: record.phone,
    };
  }
}
