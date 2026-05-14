import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { IsEmail, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";

const SESSION_COOKIE = "vigil_session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env["NODE_ENV"] === "production",
  path: "/",
  maxAge: 365 * 24 * 60 * 60 * 1000,
};

class SignInDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(1)
  newPassword!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-in")
  @HttpCode(200)
  async signIn(
    @Body() dto: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientIp = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
      ?? req.socket.remoteAddress
      ?? "unknown";

    const result = await this.authService.signIn(dto.email, dto.password, clientIp);

    if (!result.ok) {
      if (result.tooManyRequests) {
        res.status(429).json({ error: "Too many sign-in attempts. Please try again later." });
        return;
      }
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    res.cookie(SESSION_COOKIE, result.sessionId, COOKIE_OPTIONS);
    return {};
  }

  @Post("sign-out")
  @HttpCode(200)
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (sessionId) {
      await this.authService.signOut(sessionId);
    }
    res.clearCookie(SESSION_COOKIE, { path: "/", sameSite: "lax", secure: process.env["NODE_ENV"] === "production" });
    return {};
  }

  @Get("me")
  async me(@Req() req: Request) {
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!sessionId) throw new UnauthorizedException();

    const user = await this.authService.getMe(sessionId);
    if (!user) throw new UnauthorizedException();

    return { email: user.email };
  }

  @Post("change-password")
  @HttpCode(200)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!sessionId) {
      res.status(401).json({ error: "Not authenticated." });
      return;
    }

    const result = await this.authService.changePassword(
      sessionId,
      dto.currentPassword,
      dto.newPassword,
    );

    if (!result.ok) {
      if (result.reason === "wrong-current-password") {
        res.status(401).json({ error: "Current password is incorrect." });
        return;
      }
      res.status(422).json({ error: "New password does not meet policy requirements.", errors: result.errors });
      return;
    }

    return {};
  }
}
