export const SNS_CLIENT = "SNS_CLIENT";

export interface SnsSubscribeResult {
  subscriptionArn: string;
}

export interface SnsSubscriptionAttributes {
  status: string;
}

export interface ISnsClient {
  subscribe(topicArn: string, endpoint: string, protocol: "email" | "sms"): Promise<SnsSubscribeResult>;
  getSubscriptionAttributes(subscriptionArn: string): Promise<SnsSubscriptionAttributes | null>;
}
