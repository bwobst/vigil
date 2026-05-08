import "reflect-metadata";
import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "node:path";
import { ExecutorModule } from "./executor/executor.module";
import { PrismaModule } from "./prisma/prisma.module";
import { WatchModule } from "./watch/watch.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "schema.graphql"),
      sortSchema: true,
    }),
    PrismaModule,
    ExecutorModule,
    WatchModule,
  ],
})
export class AppModule {}
