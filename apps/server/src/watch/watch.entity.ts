import { Field, GraphQLISODateTime, ID, ObjectType } from "@nestjs/graphql";
import { ConditionOperator, ResponseType } from "./watch.types";

@ObjectType()
export class Watch {
  @Field(() => ID)
  id!: string;

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

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
