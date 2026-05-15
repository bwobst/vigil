import { Injectable } from "@nestjs/common";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
  replyTo?: string;
}

@Injectable()
export class MailConfigService {
  isConfigured(): boolean {
    return !!(process.env["SMTP_HOST"] && process.env["MAIL_FROM"]);
  }

  getSmtpConfig(): SmtpConfig | null {
    const host = process.env["SMTP_HOST"];
    const from = process.env["MAIL_FROM"];
    if (!host || !from) return null;
    const rawPort = parseInt(process.env["SMTP_PORT"] ?? "587", 10);
    const port = isNaN(rawPort) ? 587 : rawPort;
    const secure = process.env["SMTP_SECURE"] === "true";
    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASSWORD"];
    return {
      host,
      port,
      secure,
      auth: user ? { user, pass: pass ?? "" } : undefined,
      from,
      replyTo: process.env["MAIL_REPLY_TO"],
    };
  }
}
