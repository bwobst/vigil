import { Module } from "@nestjs/common";
import { SchedulerModule } from "../scheduler/scheduler.module";
import { WatchRunModule } from "../watch-run/watch-run.module";
import { WatchController } from "./watch.controller";
import { WatchService } from "./watch.service";

@Module({
  imports: [SchedulerModule, WatchRunModule],
  controllers: [WatchController],
  providers: [WatchService],
  exports: [WatchService],
})
export class WatchModule {}
