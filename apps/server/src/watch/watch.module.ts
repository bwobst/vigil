import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationModule } from "../notification/notification.module";
import { SchedulerModule } from "../scheduler/scheduler.module";
import { WatchRunModule } from "../watch-run/watch-run.module";
import { WatchController } from "./watch.controller";
import { WatchService } from "./watch.service";

@Module({
  imports: [AuthModule, NotificationModule, SchedulerModule, WatchRunModule],
  controllers: [WatchController],
  providers: [WatchService],
  exports: [WatchService],
})
export class WatchModule {}
