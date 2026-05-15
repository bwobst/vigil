# Operator guide: Watch alert notifications

Vigil sends plain-text alerts to Watch owners when a condition-met or execution-error edge is detected. Delivery is handled by a pg-boss worker; the backend is selected at startup via `NOTIFICATION_BACKEND`.

## Environment variables

All variables are read at runtime from the server process environment.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NOTIFICATION_BACKEND` | No | `mock` | `mock` logs alerts to stdout; `sns` publishes via AWS SNS |
| `SNS_TOPIC_ARN` | Yes (for SNS) | — | ARN of the SNS topic provisioned by Terraform (us-west-2). Also gates `notificationsReady` in the client |
| `AWS_REGION` | Yes (for SNS) | — | AWS region for the SNS client, e.g. `us-west-2` |
| `PUBLIC_BASE_URL` | Yes (for useful links) | — | Canonical public origin of the Vigil SPA, e.g. `https://vigil.example.com`. Used to build Watch links in alert bodies |

Notifications are **ready** (`notificationsReady: true`) when `SNS_TOPIC_ARN` is set. The client shows a warning to users who enable per-Watch email notifications when notifications are not ready.

## Delivery behavior

- Alerts fire on **edges**, not on every tick: once on entry into a condition-met or error stretch, then again only after the Watch recovers and the condition is met (or an error occurs) again.
- Each edge/run combination is enqueued once (`singletonKey` in pg-boss). The worker retries up to **3 times** with a **60-second** delay on transient failures before abandoning the attempt.
- When the worker picks up a job it re-checks whether the Watch still exists and whether the owner still has email notifications enabled. If either check fails the job is silently dropped.

## Local development (mock backend)

The default `NOTIFICATION_BACKEND=mock` requires no external services. When a notification edge fires, the composed alert is logged to the server's stdout:

```
[MockNotificationPublisher] [MOCK NOTIFICATION] To: user@example.com | Subject: Vigil alert: condition met — My Watch
Your watch "My Watch" recorded a condition-met result.
...
```

To trigger an alert locally:
1. Create a Watch with **Email alerts** enabled.
2. Use the **Run now** button on the watch detail page to execute the watch immediately.
3. Check the server logs for `[MOCK NOTIFICATION]` output.

No AWS credentials or external services are needed in this mode.
