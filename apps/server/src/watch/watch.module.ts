import { Module } from "@nestjs/common";
import { SchedulerModule } from "../scheduler/scheduler.module";
import { WatchResolver } from "./watch.resolver";
import { WatchService } from "./watch.service";

@Module({
  imports: [SchedulerModule],
  providers: [WatchResolver, WatchService],
  exports: [WatchService],
})
export class WatchModule {}
