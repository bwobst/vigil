import { Injectable } from "@nestjs/common";
import type { EdgeType } from "./mail-notification.policy";

const MAX_VALUE_LEN = 200;
const MAX_ERROR_LEN = 200;
const MAX_NAME_LEN = 100;

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function sanitize(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

@Injectable()
export class MailComposer {
  compose(
    edgeType: EdgeType,
    watch: { id: string; name: string },
    run: { startedAt: Date; extractedValue: string | null; error: string | null },
    user: { email: string },
  ): MailMessage {
    const baseUrl = (process.env["PUBLIC_BASE_URL"] ?? "").replace(/\/$/, "");
    const watchLink = `${baseUrl}/watches/${watch.id}`;
    const runTime = run.startedAt.toISOString();
    const watchName = sanitize(truncate(watch.name, MAX_NAME_LEN));

    if (edgeType === "CONDITION_MET") {
      const value =
        run.extractedValue != null
          ? sanitize(truncate(run.extractedValue, MAX_VALUE_LEN))
          : "(none)";
      return {
        to: user.email,
        subject: `Vigil alert: condition met — ${watchName}`,
        text: [
          `Your watch "${watchName}" recorded a condition-met result.`,
          ``,
          `Time:  ${runTime}`,
          `Value: ${value}`,
          ``,
          `View watch: ${watchLink}`,
        ].join("\n"),
      };
    } else {
      const excerpt =
        run.error != null ? sanitize(truncate(run.error, MAX_ERROR_LEN)) : "(unknown error)";
      return {
        to: user.email,
        subject: `Vigil alert: execution error — ${watchName}`,
        text: [
          `Your watch "${watchName}" encountered an execution error.`,
          ``,
          `Time:  ${runTime}`,
          `Error: ${excerpt}`,
          ``,
          `View watch: ${watchLink}`,
        ].join("\n"),
      };
    }
  }
}
