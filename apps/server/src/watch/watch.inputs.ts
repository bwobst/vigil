import { Field, InputType } from "@nestjs/graphql";
import { ConditionOperator, ResponseType } from "./watch.types";

@InputType()
export class CreateWatchInput {
  @Field()
  name!: string;

  @Field()
  targetUrl!: string;

  @Field(() => ResponseType)
  responseType!: ResponseType;

  @Field()
  extractorExpression!: string;

  @Field(() => ConditionOperator)
  conditionOperator!: ConditionOperator;

  @Field({ nullable: true })
  expectedValue?: string | null;

  @Field()
  scheduleExpression!: string;
}

@InputType()
export class UpdateWatchInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  targetUrl?: string;

  @Field(() => ResponseType, { nullable: true })
  responseType?: ResponseType;

  @Field({ nullable: true })
  extractorExpression?: string;

  @Field(() => ConditionOperator, { nullable: true })
  conditionOperator?: ConditionOperator;

  @Field({ nullable: true })
  expectedValue?: string | null;

  @Field({ nullable: true })
  scheduleExpression?: string;
}
