import { Module } from "@nestjs/common";
import { WatchResolver } from "./watch.resolver";
import { WatchService } from "./watch.service";

@Module({
  providers: [WatchResolver, WatchService],
  exports: [WatchService],
})
export class WatchModule {}
