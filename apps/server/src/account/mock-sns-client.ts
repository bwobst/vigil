import { Injectable } from "@nestjs/common";
import type { ISnsClient, SnsSubscribeResult, SnsSubscriptionAttributes } from "./sns-client.interface";

@Injectable()
export class MockSnsClient implements ISnsClient {
  async subscribe(topicArn: string, endpoint: string, _protocol: string): Promise<SnsSubscribeResult> {
    return {
      subscriptionArn: `arn:aws:sns:us-east-1:000000000000:mock-topic:${endpoint.replace(/[^a-zA-Z0-9]/g, "-")}`,
    };
  }

  async getSubscriptionAttributes(_subscriptionArn: string): Promise<SnsSubscriptionAttributes | null> {
    return { status: "PendingConfirmation" };
  }
}
