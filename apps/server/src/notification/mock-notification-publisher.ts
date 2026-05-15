import { Injectable, Logger } from "@nestjs/common";
import type { NotificationMessage } from "./notification-composer";
import type { INotificationPublisher } from "./notification-publisher.interface";

@Injectable()
export class MockNotificationPublisher implements INotificationPublisher {
  private readonly logger = new Logger(MockNotificationPublisher.name);

  async publish(message: NotificationMessage): Promise<void> {
    this.logger.log(
      `[MOCK NOTIFICATION] To: ${message.to} | Subject: ${message.subject}\n${message.text}`,
    );
  }
}
