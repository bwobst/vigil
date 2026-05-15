import { Controller, Get } from "@nestjs/common";
import { MailConfigService } from "./mail-config.service";

@Controller("mail")
export class MailConfigController {
  constructor(private readonly mailConfigService: MailConfigService) {}

  @Get("readiness")
  getReadiness() {
    return { mailReady: this.mailConfigService.isConfigured() };
  }
}
