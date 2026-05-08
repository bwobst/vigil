import { Args, ID, Mutation, Resolver } from "@nestjs/graphql";
import { WatchRun } from "../watch-run/watch-run.entity";
import { SchedulerService } from "./scheduler.service";

@Resolver()
export class SchedulerResolver {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Mutation(() => WatchRun)
  runWatch(@Args("watchId", { type: () => ID }) watchId: string): Promise<WatchRun> {
    return this.schedulerService.runNow(watchId);
  }
}
