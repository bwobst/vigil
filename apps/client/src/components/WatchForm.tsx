import { useState } from "react";
import type { ConditionOperator, ResponseType } from "@/api/types";
import { JsonPathPlayground } from "@/components/JsonPathPlayground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export interface WatchFormValues {
  name: string;
  targetUrl: string;
  responseType: ResponseType;
  extractorExpression: string;
  conditionOperator: ConditionOperator;
  expectedValue: string;
  scheduleExpression: string;
  notifyEmail: boolean;
}

interface WatchFormProps {
  defaultValues?: Partial<WatchFormValues>;
  onSubmit: (values: WatchFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  isPending: boolean;
  serverError?: string | null;
  notificationsReady?: boolean;
}

const NUMERIC_OPERATORS: ConditionOperator[] = ["LESS_THAN", "GREATER_THAN"];

function isFiniteNumberString(s: string): boolean {
  const trimmed = s.trim();
  return trimmed !== "" && Number.isFinite(Number(trimmed));
}

function validate(values: WatchFormValues): Partial<Record<keyof WatchFormValues, string>> {
  const errors: Partial<Record<keyof WatchFormValues, string>> = {};
  if (!values.name.trim()) errors.name = "Name is required";
  if (!values.targetUrl.trim()) errors.targetUrl = "Target URL is required";
  if (!values.extractorExpression.trim()) errors.extractorExpression = "Extractor expression is required";
  if (!values.scheduleExpression.trim()) errors.scheduleExpression = "Schedule expression is required";
  if (values.conditionOperator === "EQUALS" && !values.expectedValue.trim()) {
    errors.expectedValue = "Expected value is required for EQUALS condition";
  }
  if (NUMERIC_OPERATORS.includes(values.conditionOperator)) {
    if (!values.expectedValue.trim()) {
      errors.expectedValue = "Numeric threshold is required";
    } else if (!isFiniteNumberString(values.expectedValue)) {
      errors.expectedValue = "Threshold must be a finite number (e.g. 42, 3.14, 1e3)";
    }
  }
  return errors;
}

export function WatchForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  isPending,
  serverError,
  notificationsReady,
}: WatchFormProps) {
  const [values, setValues] = useState<WatchFormValues>({
    name: defaultValues?.name ?? "",
    targetUrl: defaultValues?.targetUrl ?? "",
    responseType: defaultValues?.responseType ?? "HTML",
    extractorExpression: defaultValues?.extractorExpression ?? "",
    conditionOperator: defaultValues?.conditionOperator ?? "CHANGED",
    expectedValue: defaultValues?.expectedValue ?? "",
    scheduleExpression: defaultValues?.scheduleExpression ?? "",
    notifyEmail: defaultValues?.notifyEmail ?? false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof WatchFormValues, string>>>({});

  function set<K extends keyof WatchFormValues>(key: K, value: WatchFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="My Watch"
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="targetUrl">Target URL</Label>
        <Input
          id="targetUrl"
          type="url"
          value={values.targetUrl}
          onChange={(e) => set("targetUrl", e.target.value)}
          placeholder="https://example.com"
          aria-describedby={errors.targetUrl ? "targetUrl-error" : undefined}
        />
        {errors.targetUrl && (
          <p id="targetUrl-error" className="text-sm text-destructive">{errors.targetUrl}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="responseType">Response type</Label>
        <Select
          id="responseType"
          value={values.responseType}
          onChange={(e) => set("responseType", e.target.value as ResponseType)}
        >
          <option value="HTML">HTML</option>
          <option value="JSON">JSON</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="extractorExpression">Extractor expression</Label>
        <Input
          id="extractorExpression"
          value={values.extractorExpression}
          onChange={(e) => set("extractorExpression", e.target.value)}
          placeholder="CSS selector or JSONPath"
          className="font-mono"
          aria-describedby={errors.extractorExpression ? "extractorExpression-error" : undefined}
        />
        {errors.extractorExpression && (
          <p id="extractorExpression-error" className="text-sm text-destructive">{errors.extractorExpression}</p>
        )}
      </div>

      {values.responseType === "JSON" && (
        <JsonPathPlayground extractorExpression={values.extractorExpression} />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="conditionOperator">Condition operator</Label>
        <Select
          id="conditionOperator"
          value={values.conditionOperator}
          onChange={(e) => {
            const op = e.target.value as ConditionOperator;
            setValues((prev) => ({ ...prev, conditionOperator: op, expectedValue: op === "CHANGED" ? "" : prev.expectedValue }));
            setErrors((prev) => ({ ...prev, conditionOperator: undefined, expectedValue: undefined }));
          }}
        >
          <option value="CHANGED">CHANGED</option>
          <option value="EQUALS">EQUALS</option>
          <option value="LESS_THAN">LESS_THAN</option>
          <option value="GREATER_THAN">GREATER_THAN</option>
        </Select>
      </div>

      {values.conditionOperator === "EQUALS" && (
        <div className="space-y-1.5">
          <Label htmlFor="expectedValue">Expected value</Label>
          <p className="text-sm text-muted-foreground">String equality — the extracted value must exactly match this text.</p>
          <Input
            id="expectedValue"
            value={values.expectedValue}
            onChange={(e) => set("expectedValue", e.target.value)}
            placeholder="Expected value"
            className="font-mono"
            aria-describedby={errors.expectedValue ? "expectedValue-error" : undefined}
          />
          {errors.expectedValue && (
            <p id="expectedValue-error" className="text-sm text-destructive">{errors.expectedValue}</p>
          )}
        </div>
      )}

      {NUMERIC_OPERATORS.includes(values.conditionOperator) && (
        <div className="space-y-1.5">
          <Label htmlFor="expectedValue">Numeric threshold</Label>
          <p className="text-sm text-muted-foreground">
            The extracted value will be parsed as a number and compared to this threshold. Supports integers, decimals, and scientific notation (e.g. 1e3).
          </p>
          <Input
            id="expectedValue"
            value={values.expectedValue}
            onChange={(e) => set("expectedValue", e.target.value)}
            placeholder="e.g. 42 or 3.14 or 1e3"
            className="font-mono"
            aria-describedby={errors.expectedValue ? "expectedValue-error" : undefined}
          />
          {errors.expectedValue && (
            <p id="expectedValue-error" className="text-sm text-destructive">{errors.expectedValue}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="scheduleExpression">Schedule (cron expression)</Label>
        <Input
          id="scheduleExpression"
          value={values.scheduleExpression}
          onChange={(e) => set("scheduleExpression", e.target.value)}
          placeholder="*/5 * * * *"
          className="font-mono"
          aria-describedby={errors.scheduleExpression ? "scheduleExpression-error" : undefined}
        />
        {errors.scheduleExpression && (
          <p id="scheduleExpression-error" className="text-sm text-destructive">{errors.scheduleExpression}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <input
            id="notifyEmail"
            type="checkbox"
            checked={values.notifyEmail}
            onChange={(e) => set("notifyEmail", e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <Label htmlFor="notifyEmail">Email alerts</Label>
        </div>
        <p className="text-sm text-muted-foreground pl-7">
          Send an email to your account address when the condition is first met or when an execution error occurs.
        </p>
        {values.notifyEmail && notificationsReady === false && (
          <p className="text-sm text-destructive pl-7" role="alert">
            Email alerts are enabled but this deployment is not configured for notifications. Alerts will not be delivered until an operator configures SNS_TOPIC_ARN.
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">{serverError}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
