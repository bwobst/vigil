import { Injectable } from "@nestjs/common";

@Injectable()
export class MailConfigService {
  isConfigured(): boolean {
    return !!(process.env["SMTP_HOST"] && process.env["MAIL_FROM"]);
  }
}
