import { Args, ID, Query, Resolver } from "@nestjs/graphql";
import { WatchRun } from "./watch-run.entity";
import { WatchRunService } from "./watch-run.service";

@Resolver(() => WatchRun)
export class WatchRunResolver {
  constructor(private readonly watchRunService: WatchRunService) {}

  @Query(() => [WatchRun])
  watchRuns(@Args("watchId", { type: () => ID }) watchId: string): Promise<WatchRun[]> {
    return this.watchRunService.findByWatch(watchId);
  }

  @Query(() => WatchRun, { nullable: true })
  watchRun(@Args("id", { type: () => ID }) id: string): Promise<WatchRun | null> {
    return this.watchRunService.findOne(id);
  }
}
