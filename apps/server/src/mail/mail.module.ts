import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MailConfigController } from "./mail-config.controller";
import { MailConfigService } from "./mail-config.service";
import { MailComposer } from "./mail-composer";
import { MailQueueService } from "./mail-queue.service";

@Module({
  imports: [PrismaModule],
  controllers: [MailConfigController],
  providers: [MailConfigService, MailComposer, MailQueueService],
  exports: [MailConfigService, MailComposer, MailQueueService],
})
export class MailModule {}
