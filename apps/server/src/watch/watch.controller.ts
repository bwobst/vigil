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
} from "@nestjs/common";
import { CreateWatchDto, UpdateWatchDto } from "./watch.dto";
import { WatchService } from "./watch.service";

@Controller("watches")
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @Get()
  findAll() {
    return this.watchService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const watch = await this.watchService.findOne(id);
    if (!watch) throw new NotFoundException();
    return watch;
  }

  @Post()
  create(@Body() dto: CreateWatchDto) {
    return this.watchService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateWatchDto) {
    return this.watchService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  async delete(@Param("id") id: string) {
    await this.watchService.delete(id);
  }
}
