import { Controller, Get } from "@nestjs/common";
import { NotificationConfigService } from "./notification-config.service";

@Controller("notifications")
export class NotificationReadinessController {
  constructor(private readonly notificationConfig: NotificationConfigService) {}

  @Get("readiness")
  getReadiness() {
    return { notificationsReady: this.notificationConfig.isConfigured() };
  }
}
