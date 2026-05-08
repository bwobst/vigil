import { Module } from "@nestjs/common";
import { ExecutorModule } from "../executor/executor.module";
import { WatchRunModule } from "../watch-run/watch-run.module";
import { SchedulerResolver } from "./scheduler.resolver";
import { SchedulerService } from "./scheduler.service";

@Module({
  imports: [ExecutorModule, WatchRunModule],
  providers: [SchedulerService, SchedulerResolver],
  exports: [SchedulerService],
})
export class SchedulerModule {}
