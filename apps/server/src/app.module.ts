import "reflect-metadata";
import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { MailConfigModule } from "./mail/mail-config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { WatchRunModule } from "./watch-run/watch-run.module";
import { WatchModule } from "./watch/watch.module";

@Module({
  imports: [PrismaModule, AuthModule, MailConfigModule, WatchModule, WatchRunModule],
})
export class AppModule {}
