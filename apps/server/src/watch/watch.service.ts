import { BadRequestException, Injectable } from "@nestjs/common";
import { CronExpressionParser } from "cron-parser";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateWatchInput, UpdateWatchInput } from "./watch.inputs";
import type { Watch } from "./watch.entity";
import { ConditionOperator } from "./watch.types";

@Injectable()
export class WatchService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Watch[]> {
    return this.prisma.watch.findMany({ orderBy: { createdAt: "asc" } }) as Promise<Watch[]>;
  }

  findOne(id: string): Promise<Watch | null> {
    return this.prisma.watch.findUnique({ where: { id } }) as Promise<Watch | null>;
  }

  async create(input: CreateWatchInput): Promise<Watch> {
    this.validateInput(input.scheduleExpression, input.conditionOperator, input.expectedValue ?? null);
    return this.prisma.watch.create({ data: input }) as Promise<Watch>;
  }

  async update(id: string, input: UpdateWatchInput): Promise<Watch> {
    const existing = await this.prisma.watch.findUniqueOrThrow({ where: { id } });
    const scheduleExpression = input.scheduleExpression ?? existing.scheduleExpression;
    const conditionOperator = (input.conditionOperator ?? existing.conditionOperator) as ConditionOperator;
    const expectedValue = "expectedValue" in input ? (input.expectedValue ?? null) : (existing.expectedValue ?? null);
    this.validateInput(scheduleExpression, conditionOperator, expectedValue);
    return this.prisma.watch.update({ where: { id }, data: input }) as Promise<Watch>;
  }

  async delete(id: string): Promise<string> {
    await this.prisma.watch.delete({ where: { id } });
    return id;
  }

  private validateInput(
    scheduleExpression: string,
    conditionOperator: ConditionOperator,
    expectedValue: string | null,
  ): void {
    let interval: ReturnType<typeof CronExpressionParser.parse>;
    try {
      interval = CronExpressionParser.parse(scheduleExpression);
    } catch {
      throw new BadRequestException(`Invalid cron expression: "${scheduleExpression}"`);
    }

    const first = interval.next().toDate();
    const second = interval.next().toDate();
    const intervalMs = second.getTime() - first.getTime();
    if (intervalMs < 5 * 60 * 1000) {
      throw new BadRequestException(
        `Schedule expression "${scheduleExpression}" produces an interval shorter than 5 minutes`,
      );
    }

    if (conditionOperator === ConditionOperator.EQUALS && !expectedValue) {
      throw new BadRequestException(
        "expectedValue is required when conditionOperator is EQUALS",
      );
    }
  }
}
