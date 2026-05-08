import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { WatchRun } from "./watch-run.entity";
import type { RunStatus } from "./watch-run.types";

export interface RecordRunInput {
  watchId: string;
  startedAt: Date;
  completedAt: Date;
  status: RunStatus;
  extractedValue: string | null;
  conditionMet: boolean | null;
  error: string | null;
}

@Injectable()
export class WatchRunService {
  constructor(private readonly prisma: PrismaService) {}

  findByWatch(watchId: string): Promise<WatchRun[]> {
    return this.prisma.watchRun.findMany({
      where: { watchId },
      orderBy: { startedAt: "desc" },
    }) as Promise<WatchRun[]>;
  }

  findOne(id: string): Promise<WatchRun | null> {
    return this.prisma.watchRun.findUnique({ where: { id } }) as Promise<WatchRun | null>;
  }

  recordRun(input: RecordRunInput): Promise<WatchRun> {
    return this.prisma.watchRun.create({ data: input }) as Promise<WatchRun>;
  }
}
