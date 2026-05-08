import { Module } from "@nestjs/common";
import { SchedulerModule } from "../scheduler/scheduler.module";
import { WatchController } from "./watch.controller";
import { WatchService } from "./watch.service";

@Module({
  imports: [SchedulerModule],
  controllers: [WatchController],
  providers: [WatchService],
  exports: [WatchService],
})
export class WatchModule {}
