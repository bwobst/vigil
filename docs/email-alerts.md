# Operator guide: Watch alert email

Vigil can send plain-text email alerts to Watch owners when a condition-met or execution-error edge is detected. Delivery is handled by a pg-boss worker using an operator-supplied SMTP relay; no credentials or relay details are ever exposed to end users.

## Environment variables

All variables are read at runtime from the server process environment.

| Variable | Required | Default | Description |
|---|---|---|---|
| `SMTP_HOST` | Yes (to enable mail) | — | Hostname of the outbound SMTP relay |
| `SMTP_PORT` | No | `587` | TCP port for the relay |
| `SMTP_SECURE` | No | `false` | Set to `true` to use implicit TLS (typically port 465); leave unset or `false` for STARTTLS |
| `SMTP_USER` | No | — | SMTP authentication username; omit for unauthenticated relays |
| `SMTP_PASSWORD` | No | — | SMTP authentication password |
| `MAIL_FROM` | Yes (to enable mail) | — | RFC 5321 sender address, e.g. `Vigil Alerts <alerts@example.com>` |
| `MAIL_REPLY_TO` | No | — | Optional Reply-To header address |
| `PUBLIC_BASE_URL` | Yes (for useful links) | — | Canonical public origin of the Vigil SPA, e.g. `https://vigil.example.com`. Used to build Watch links in alert bodies; the worker has no HTTP request context, so this must be set explicitly |

Mail is **disabled** when `SMTP_HOST` or `MAIL_FROM` is absent. The client surfaces a warning to users who enable per-Watch email notifications when mail is not configured.

### Delivery behavior

- Alerts fire on **edges**, not on every tick: once on entry into a condition-met or error stretch, then again only after the Watch recovers and the condition is met (or an error occurs) again.
- Each edge/run combination is enqueued once (`singletonKey` in pg-boss). The worker retries up to **3 times** with a **60-second** delay on transient relay failures before abandoning the attempt and logging the exhaustion for the operator.
- When the worker picks up a job it re-checks whether the Watch still exists and whether the owner still has email notifications enabled. If either check fails the job is silently dropped (no user-visible error); this handles the case where a user disabled notifications after the edge was detected.
- Delivered messages go to the Watch owner's normalized sign-in email. There is no per-Watch override inbox.

## Local development with Mailpit

[Mailpit](https://mailpit.axllent.org/) is an SMTP sink that captures outbound email without forwarding it. Point the server at Mailpit instead of a real relay:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
MAIL_FROM=vigil@localhost
PUBLIC_BASE_URL=http://localhost:5173
```

Run Mailpit (example via Docker):

```sh
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
```

The web UI is available at `http://localhost:8025`. All captured messages appear there; nothing is forwarded to real recipients.

The same "no transport means no delivery" rule applies in development: if `SMTP_HOST` or `MAIL_FROM` is unset, no mail jobs are enqueued regardless of per-Watch notification settings. Mailpit is the recommended approach for exercising the full send path locally; there is no development-only fake-delivery mode built into Vigil.
