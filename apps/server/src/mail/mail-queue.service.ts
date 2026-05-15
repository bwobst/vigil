import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import PgBoss = require("pg-boss");
import * as nodemailer from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";
import { MailConfigService } from "./mail-config.service";
import { MailComposer, type MailMessage } from "./mail-composer";
import type { EdgeType } from "./mail-notification.policy";

interface MailJobData {
  watchId: string;
  runId: string;
  edgeType: string;
}

const MAIL_QUEUE = "mail:notification";

@Injectable()
export class MailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailQueueService.name);
  private boss: PgBoss | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailConfig: MailConfigService,
    private readonly composer: MailComposer,
  ) {}

  async onModuleInit() {
    const url = process.env["DATABASE_URL"];
    if (!url) {
      this.logger.warn("DATABASE_URL not set — mail queue disabled");
      return;
    }

    this.boss = new PgBoss(url);
    this.boss.on("error", (err: unknown) => this.logger.error("pg-boss mail error", err));
    await this.boss.start();
    await this.boss.work<MailJobData>(
      MAIL_QUEUE,
      { newJobCheckIntervalSeconds: 5 },
      async (job: PgBoss.Job<MailJobData>) => {
        await this.handleJob(job.data);
      },
    );
    this.logger.log("Mail queue worker started");
  }

  async onModuleDestroy() {
    if (this.boss) {
      await this.boss.stop({ graceful: true });
    }
  }

  async enqueueNotification(watchId: string, runId: string, edgeType: EdgeType): Promise<void> {
    if (!this.boss) return;
    const singletonKey = `${watchId}:${runId}:${edgeType}`;
    await this.boss.send(MAIL_QUEUE, { watchId, runId, edgeType }, {
      singletonKey,
      retryLimit: 3,
      retryDelay: 60,
      expireInHours: 24,
    });
    this.logger.log(`Enqueued mail notification for watch ${watchId} run ${runId} edge ${edgeType}`);
  }

  private async handleJob(data: MailJobData): Promise<void> {
    const { watchId, runId, edgeType } = data;

    const watch = await this.prisma.watch.findUnique({
      where: { id: watchId },
      include: { user: true },
    });

    if (!watch) {
      this.logger.log(`Mail job skipped: watch ${watchId} no longer exists`);
      return;
    }

    if (!watch.notifyEmail) {
      this.logger.log(`Mail job skipped: watch ${watchId} has email notifications disabled`);
      return;
    }

    if (!watch.user?.email) {
      this.logger.warn(`Mail job skipped: watch ${watchId} has no associated user email`);
      return;
    }

    const run = await this.prisma.watchRun.findUnique({ where: { id: runId } });
    if (!run) {
      this.logger.log(`Mail job skipped: watch run ${runId} not found`);
      return;
    }

    const message = this.composer.compose(edgeType as EdgeType, watch, run, watch.user);
    await this.sendMail(message);
    this.logger.log(`Mail sent for watch ${watchId} run ${runId} edge ${edgeType}`);
  }

  private async sendMail(message: MailMessage): Promise<void> {
    const config = this.mailConfig.getSmtpConfig();
    if (!config) {
      this.logger.warn("Mail not sent: SMTP not configured");
      return;
    }

    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    await transport.sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}
