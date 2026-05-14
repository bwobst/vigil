import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword, verifyPassword } from "../password/password-hash";
import { normalizeEmail, validatePassword } from "../password/password-policy";
import { RateLimiter } from "./rate-limiter";

export const SESSION_COOKIE = "vigil_session";

const DUMMY_HASH = "$2a$12$zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz..";

export type SignInResult =
  | { ok: true; sessionId: string }
  | { ok: false; tooManyRequests: boolean };

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; reason: "wrong-current-password" | "policy-violation"; errors?: string[] };

@Injectable()
export class AuthService {
  private readonly rateLimiter = new RateLimiter();

  constructor(private readonly prisma: PrismaService) {}

  async signIn(email: string, password: string, clientIp: string): Promise<SignInResult> {
    if (!this.rateLimiter.check(clientIp)) {
      return { ok: false, tooManyRequests: true };
    }

    const normalized = normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });

    const hash = user?.password ?? DUMMY_HASH;
    const valid = await verifyPassword(hash, password);

    if (!user || !valid) {
      return { ok: false, tooManyRequests: false };
    }

    const session = await this.prisma.session.create({ data: { userId: user.id } });
    return { ok: true, sessionId: session.id };
  }

  async signOut(sessionId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  async getMe(sessionId: string): Promise<{ email: string; id: string } | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session) return null;
    return { email: session.user.email, id: session.userId };
  }

  async changePassword(
    sessionId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session) return { ok: false, reason: "wrong-current-password" };

    const valid = await verifyPassword(session.user.password, currentPassword);
    if (!valid) return { ok: false, reason: "wrong-current-password" };

    const policy = validatePassword(newPassword);
    if (!policy.valid) {
      return { ok: false, reason: "policy-violation", errors: policy.errors };
    }

    const newHash = await hashPassword(newPassword);
    await this.prisma.$transaction([
      this.prisma.session.deleteMany({
        where: { userId: session.userId, NOT: { id: sessionId } },
      }),
      this.prisma.user.update({
        where: { id: session.userId },
        data: { password: newHash },
      }),
    ]);

    return { ok: true };
  }
}
