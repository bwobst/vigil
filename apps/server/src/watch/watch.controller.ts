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
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService, SESSION_COOKIE } from "../auth/auth.service";
import { MailConfigService } from "../mail/mail-config.service";
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
    private readonly mailConfigService: MailConfigService,
  ) {}

  private async requireAuth(req: Request): Promise<string> {
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!sessionId) throw new UnauthorizedException();
    const user = await this.authService.getMe(sessionId);
    if (!user) throw new UnauthorizedException();
    return user.id;
  }

  private toResponse<T extends object>(watch: T) {
    return { ...watch, mailReady: this.mailConfigService.isConfigured() };
  }

  @Get()
  async findAll(@Req() req: Request) {
    const userId = await this.requireAuth(req);
    const watches = await this.watchService.findAll(userId);
    return watches.map((w) => this.toResponse(w));
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req: Request) {
    const userId = await this.requireAuth(req);
    const watch = await this.watchService.findOne(id, userId);
    if (!watch) throw new NotFoundException();
    return this.toResponse(watch);
  }

  @Post()
  async create(@Body() dto: CreateWatchDto, @Req() req: Request) {
    const userId = await this.requireAuth(req);
    const watch = await this.watchService.create(dto, userId);
    return this.toResponse(watch);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateWatchDto, @Req() req: Request) {
    const userId = await this.requireAuth(req);
    const watch = await this.watchService.update(id, userId, dto);
    return this.toResponse(watch);
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
  async runs(
    @Param("id") id: string,
    @Query("page") pageStr: string | undefined,
    @Req() req: Request,
  ) {
    const userId = await this.requireAuth(req);
    const watch = await this.watchService.findOne(id, userId);
    if (!watch) throw new NotFoundException();
    const page = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);
    return this.watchRunService.findByWatch(id, page);
  }
}
