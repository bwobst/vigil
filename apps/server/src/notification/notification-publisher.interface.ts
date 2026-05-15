import type { NotificationMessage } from "./notification-composer";

export interface INotificationPublisher {
  publish(message: NotificationMessage): Promise<void>;
}

export const NOTIFICATION_PUBLISHER = "NOTIFICATION_PUBLISHER";
