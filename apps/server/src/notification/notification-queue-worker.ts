import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import PgBoss = require("pg-boss");
import { PrismaService } from "../prisma/prisma.service";
import { NotificationComposer } from "./notification-composer";
import { NOTIFICATION_PUBLISHER, type INotificationPublisher } from "./notification-publisher.interface";
import type { EdgeType } from "./notification.policy";

interface NotificationJobData {
  watchId: string;
  runId: string;
  edgeType: string;
}

const NOTIFICATION_QUEUE = "notification:delivery";

@Injectable()
export class NotificationQueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueueWorker.name);
  private boss: PgBoss | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly composer: NotificationComposer,
    @Inject(NOTIFICATION_PUBLISHER) private readonly publisher: INotificationPublisher,
  ) {}

  async onModuleInit() {
    const url = process.env["DATABASE_URL"];
    if (!url) {
      this.logger.warn("DATABASE_URL not set — notification queue disabled");
      return;
    }

    this.boss = new PgBoss(url);
    this.boss.on("error", (err: unknown) => this.logger.error("pg-boss notification error", err));
    await this.boss.start();
    await this.boss.work<NotificationJobData>(
      NOTIFICATION_QUEUE,
      { newJobCheckIntervalSeconds: 5 },
      async (job: PgBoss.Job<NotificationJobData>) => {
        await this.handleJob(job.data);
      },
    );
    this.logger.log("Notification queue worker started");
  }

  async onModuleDestroy() {
    if (this.boss) {
      await this.boss.stop({ graceful: true });
    }
  }

  async enqueueNotification(watchId: string, runId: string, edgeType: EdgeType): Promise<void> {
    if (!this.boss) return;
    const singletonKey = `${watchId}:${runId}:${edgeType}`;
    await this.boss.send(NOTIFICATION_QUEUE, { watchId, runId, edgeType }, {
      singletonKey,
      retryLimit: 3,
      retryDelay: 60,
      expireInHours: 24,
    });
    this.logger.log(`Enqueued notification for watch ${watchId} run ${runId} edge ${edgeType}`);
  }

  private async handleJob(data: NotificationJobData): Promise<void> {
    const { watchId, runId, edgeType } = data;

    const watch = await this.prisma.watch.findUnique({
      where: { id: watchId },
      include: { user: true },
    });

    if (!watch) {
      this.logger.log(`Notification job skipped: watch ${watchId} no longer exists`);
      return;
    }

    if (!watch.notifyEmail) {
      this.logger.log(`Notification job skipped: watch ${watchId} has email notifications disabled`);
      return;
    }

    if (!watch.user?.email) {
      this.logger.warn(`Notification job skipped: watch ${watchId} has no associated user email`);
      return;
    }

    const run = await this.prisma.watchRun.findUnique({ where: { id: runId } });
    if (!run) {
      this.logger.log(`Notification job skipped: watch run ${runId} not found`);
      return;
    }

    const message = this.composer.compose(edgeType as EdgeType, watch, run, watch.user);
    await this.publisher.publish(message);
    this.logger.log(`Notification delivered for watch ${watchId} run ${runId} edge ${edgeType}`);
  }
}
