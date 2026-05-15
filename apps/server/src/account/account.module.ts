import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationModule } from "../notification/notification.module";
import { AccountController } from "./account.controller";
import { NotificationSubscriptionService } from "./notification-subscription.service";
import { MockSnsClient } from "./mock-sns-client";
import { SNS_CLIENT } from "./sns-client.interface";

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [AccountController],
  providers: [
    NotificationSubscriptionService,
    { provide: SNS_CLIENT, useClass: MockSnsClient },
  ],
  exports: [NotificationSubscriptionService],
})
export class AccountModule {}
