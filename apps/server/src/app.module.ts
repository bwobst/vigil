import "reflect-metadata";
import { Module } from "@nestjs/common";
import { AccountModule } from "./account/account.module";
import { AuthModule } from "./auth/auth.module";
import { NotificationModule } from "./notification/notification.module";
import { PrismaModule } from "./prisma/prisma.module";
import { WatchRunModule } from "./watch-run/watch-run.module";
import { WatchModule } from "./watch/watch.module";

@Module({
  imports: [PrismaModule, AuthModule, AccountModule, NotificationModule, WatchModule, WatchRunModule],
})
export class AppModule {}
