import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { WatchRun } from "./watch-run.entity";
import type { RunStatus } from "./watch-run.types";

export const RUNS_PAGE_SIZE = 20;

export interface RecordRunInput {
  watchId: string;
  startedAt: Date;
  completedAt: Date;
  status: RunStatus;
  extractedValue: string | null;
  conditionMet: boolean | null;
  error: string | null;
}

export interface WatchRunsPage {
  runs: WatchRun[];
  totalCount: number;
}

@Injectable()
export class WatchRunService {
  constructor(private readonly prisma: PrismaService) {}

  async findByWatch(watchId: string, page = 1): Promise<WatchRunsPage> {
    const skip = (page - 1) * RUNS_PAGE_SIZE;
    const [runs, totalCount] = await Promise.all([
      this.prisma.watchRun.findMany({
        where: { watchId },
        orderBy: { startedAt: "desc" },
        skip,
        take: RUNS_PAGE_SIZE,
      }),
      this.prisma.watchRun.count({ where: { watchId } }),
    ]);
    return { runs: runs as WatchRun[], totalCount };
  }

  findOne(id: string): Promise<WatchRun | null> {
    return this.prisma.watchRun.findUnique({ where: { id } }) as Promise<WatchRun | null>;
  }

  recordRun(input: RecordRunInput): Promise<WatchRun> {
    return this.prisma.watchRun.create({ data: input }) as Promise<WatchRun>;
  }
}
