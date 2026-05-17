import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance() as { set?: (key: string, value: unknown) => void };
  expressApp.set?.("trust proxy", 1);
  app.use(cookieParser());
  app.setGlobalPrefix("api", { exclude: ["graphql"] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env["PORT"] ?? 3000);
}

bootstrap();
