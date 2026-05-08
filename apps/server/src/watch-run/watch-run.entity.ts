import { Field, GraphQLISODateTime, ID, ObjectType } from "@nestjs/graphql";
import { RunStatus } from "./watch-run.types";

@ObjectType()
export class WatchRun {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  watchId!: string;

  @Field(() => GraphQLISODateTime)
  startedAt!: Date;

  @Field(() => GraphQLISODateTime)
  completedAt!: Date;

  @Field(() => RunStatus)
  status!: RunStatus;

  @Field({ nullable: true })
  extractedValue?: string | null;

  @Field({ nullable: true })
  conditionMet?: boolean | null;

  @Field({ nullable: true })
  error?: string | null;
}
