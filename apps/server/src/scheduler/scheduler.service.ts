import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import PgBoss = require("pg-boss");
import { PrismaService } from "../prisma/prisma.service";
import { ExecutorService } from "../executor/executor.service";
import { WatchRunService } from "../watch-run/watch-run.service";
import { RunStatus } from "../watch-run/watch-run.types";
import type { WatchRun } from "../watch-run/watch-run.entity";

interface WatchJobData {
  watchId: string;
}

type WatchRecord = {
  id: string;
  targetUrl: string;
  responseType: string;
  extractorExpression: string;
  conditionOperator: string;
  expectedValue: string | null;
  scheduleExpression: string;
};

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private boss: PgBoss | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly executor: ExecutorService,
    private readonly watchRunService: WatchRunService,
  ) {}

  async onModuleInit() {
    const url = process.env["DATABASE_URL"];
    if (!url) {
      this.logger.warn("DATABASE_URL not set — pg-boss scheduling disabled");
      return;
    }

    this.boss = new PgBoss(url);
    this.boss.on("error", (err: unknown) => this.logger.error("pg-boss error", err));
    await this.boss.start();

    const watches = await this.prisma.watch.findMany();
    for (const watch of watches) {
      await this.registerWatch(watch);
    }
    this.logger.log(`Registered ${watches.length} watches with pg-boss`);
  }

  async onModuleDestroy() {
    if (this.boss) {
      await this.boss.stop();
    }
  }

  async schedule(watch: WatchRecord): Promise<void> {
    if (!this.boss) return;
    await this.registerWatch(watch);
  }

  async unschedule(watchId: string): Promise<void> {
    if (!this.boss) return;
    const queueName = this.queueName(watchId);
    await this.boss.unschedule(queueName).catch(() => {});
    await this.boss.offWork(queueName).catch(() => {});
  }

  async runNow(watchId: string): Promise<WatchRun> {
    return this.executeAndRecord(watchId);
  }

  private async registerWatch(watch: WatchRecord) {
    if (!this.boss) return;
    const queueName = this.queueName(watch.id);
    await this.boss.schedule(queueName, watch.scheduleExpression, { watchId: watch.id });
    await this.boss.work<WatchJobData>(queueName, async (job: PgBoss.Job<WatchJobData>) => {
      await this.executeAndRecord(job.data.watchId);
    });
  }

  private queueName(watchId: string): string {
    return `watch:${watchId}`;
  }

  private async executeAndRecord(watchId: string): Promise<WatchRun> {
    const watch = await this.prisma.watch.findUniqueOrThrow({ where: { id: watchId } });
    const previousRun = await this.prisma.watchRun.findFirst({
      where: { watchId },
      orderBy: { startedAt: "desc" },
    });

    const startedAt = new Date();
    const result = await this.executor.execute(
      {
        targetUrl: watch.targetUrl,
        responseType: watch.responseType as "HTML" | "JSON",
        extractorExpression: watch.extractorExpression,
        conditionOperator: watch.conditionOperator as "EQUALS" | "CHANGED" | "LESS_THAN" | "GREATER_THAN",
        expectedValue: watch.expectedValue,
      },
      { previousExtractedValue: previousRun?.extractedValue ?? null },
    );
    const completedAt = new Date();

    let status: RunStatus;
    if (result.error) {
      status = RunStatus.ERROR;
    } else if (result.conditionMet) {
      status = RunStatus.PASS;
    } else {
      status = RunStatus.FAIL;
    }

    return this.watchRunService.recordRun({
      watchId,
      startedAt,
      completedAt,
      status,
      extractedValue: result.extractedValue,
      conditionMet: result.conditionMet,
      error: result.error,
    });
  }
}
