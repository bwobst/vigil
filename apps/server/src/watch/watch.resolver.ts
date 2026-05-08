import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Watch } from "./watch.entity";
import { CreateWatchInput, UpdateWatchInput } from "./watch.inputs";
import { WatchService } from "./watch.service";

@Resolver(() => Watch)
export class WatchResolver {
  constructor(private readonly watchService: WatchService) {}

  @Query(() => [Watch])
  watches(): Promise<Watch[]> {
    return this.watchService.findAll();
  }

  @Query(() => Watch, { nullable: true })
  watch(@Args("id", { type: () => ID }) id: string): Promise<Watch | null> {
    return this.watchService.findOne(id);
  }

  @Mutation(() => Watch)
  createWatch(@Args("input") input: CreateWatchInput): Promise<Watch> {
    return this.watchService.create(input);
  }

  @Mutation(() => Watch)
  updateWatch(
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateWatchInput,
  ): Promise<Watch> {
    return this.watchService.update(id, input);
  }

  @Mutation(() => ID)
  deleteWatch(@Args("id", { type: () => ID }) id: string): Promise<string> {
    return this.watchService.delete(id);
  }
}
