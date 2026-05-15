import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationConfigService {
  isConfigured(): boolean {
    return !!process.env["SNS_TOPIC_ARN"];
  }
}
