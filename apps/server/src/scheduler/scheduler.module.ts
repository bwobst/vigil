import { Module } from "@nestjs/common";
import { ExecutorModule } from "../executor/executor.module";
import { MailModule } from "../mail/mail.module";
import { WatchRunModule } from "../watch-run/watch-run.module";
import { SchedulerService } from "./scheduler.service";

@Module({
  imports: [ExecutorModule, WatchRunModule, MailModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
