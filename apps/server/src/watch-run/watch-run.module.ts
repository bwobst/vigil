import { Module } from "@nestjs/common";
import { WatchRunResolver } from "./watch-run.resolver";
import { WatchRunService } from "./watch-run.service";

@Module({
  providers: [WatchRunResolver, WatchRunService],
  exports: [WatchRunService],
})
export class WatchRunModule {}
