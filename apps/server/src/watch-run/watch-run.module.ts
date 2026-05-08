import { Module } from "@nestjs/common";
import { WatchRunService } from "./watch-run.service";

@Module({
  providers: [WatchRunService],
  exports: [WatchRunService],
})
export class WatchRunModule {}
