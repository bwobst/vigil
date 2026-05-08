import "reflect-metadata";
import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "node:path";
import { PrismaModule } from "./prisma/prisma.module";
import { WatchRunModule } from "./watch-run/watch-run.module";
import { WatchModule } from "./watch/watch.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "schema.graphql"),
      sortSchema: true,
    }),
    PrismaModule,
    WatchModule,
    WatchRunModule,
  ],
})
export class AppModule {}
