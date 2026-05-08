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

  @Field(() => String, { nullable: true })
  extractedValue?: string | null;

  @Field(() => Boolean, { nullable: true })
  conditionMet?: boolean | null;

  @Field(() => String, { nullable: true })
  error?: string | null;
}
