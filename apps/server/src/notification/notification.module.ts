import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MockNotificationPublisher } from "./mock-notification-publisher";
import { NotificationComposer } from "./notification-composer";
import { NotificationConfigService } from "./notification-config.service";
import { NotificationQueueWorker } from "./notification-queue-worker";
import { NotificationReadinessController } from "./notification-readiness.controller";
import { NOTIFICATION_PUBLISHER } from "./notification-publisher.interface";

@Module({
  imports: [PrismaModule],
  controllers: [NotificationReadinessController],
  providers: [
    NotificationConfigService,
    NotificationComposer,
    NotificationQueueWorker,
    { provide: NOTIFICATION_PUBLISHER, useClass: MockNotificationPublisher },
  ],
  exports: [NotificationConfigService, NotificationComposer, NotificationQueueWorker],
})
export class NotificationModule {}
