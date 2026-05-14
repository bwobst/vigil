import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService, SESSION_COOKIE } from "../auth/auth.service";
import { SchedulerService } from "../scheduler/scheduler.service";
import { WatchRunService } from "../watch-run/watch-run.service";
import { CreateWatchDto, UpdateWatchDto } from "./watch.dto";
import { WatchService } from "./watch.service";

@Controller("watches")
export class WatchController {
  constructor(
    private readonly watchService: WatchService,
    private readonly schedulerService: SchedulerService,
    private readonly watchRunService: WatchRunService,
    private readonly authService: AuthService,
  ) {}

  private async requireAuth(req: Request): Promise<string> {
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!sessionId) throw new UnauthorizedException();
    const user = await this.authService.getMe(sessionId);
    if (!user) throw new UnauthorizedException();
    return user.id;
  }

  @Get()
  async findAll(@Req() req: Request) {
    const userId = await this.requireAuth(req);
    return this.watchService.findAll(userId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req: Request) {
    const userId = await this.requireAuth(req);
    const watch = await this.watchService.findOne(id, userId);
    if (!watch) throw new NotFoundException();
    return watch;
  }

  @Post()
  async create(@Body() dto: CreateWatchDto, @Req() req: Request) {
    const userId = await this.requireAuth(req);
    return this.watchService.create(dto, userId);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateWatchDto, @Req() req: Request) {
    const userId = await this.requireAuth(req);
    return this.watchService.update(id, userId, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  async delete(@Param("id") id: string, @Req() req: Request) {
    const userId = await this.requireAuth(req);
    await this.watchService.delete(id, userId);
  }

  @Post(":id/run")
  @HttpCode(202)
  async run(@Param("id") id: string, @Req() req: Request) {
    const userId = await this.requireAuth(req);
    const watch = await this.watchService.findOne(id, userId);
    if (!watch) throw new NotFoundException();
    void this.schedulerService.runNow(id);
  }

  @Get(":id/runs")
  async runs(@Param("id") id: string, @Req() req: Request) {
    const userId = await this.requireAuth(req);
    const watch = await this.watchService.findOne(id, userId);
    if (!watch) throw new NotFoundException();
    return this.watchRunService.findByWatch(id);
  }
}
