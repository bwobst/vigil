import { useEffect, useRef, useState } from "react";
import { evaluateJsonPath, formatJsonPathValue } from "@vigil/json-extractor";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type PreviewState =
  | { type: "empty" }
  | { type: "error"; message: string }
  | { type: "no-matches" }
  | { type: "match"; primary: string; all: unknown[] };

export function getPreviewState(sampleJson: string, extractorExpression: string): PreviewState {
  if (!sampleJson.trim()) return { type: "empty" };
  const result = evaluateJsonPath(sampleJson, extractorExpression);
  if (result.error) return { type: "error", message: result.error };
  if (result.primary === null) return { type: "no-matches" };
  return { type: "match", primary: result.primary, all: result.allValues };
}

interface JsonPathPlaygroundProps {
  extractorExpression: string;
}

export function JsonPathPlayground({ extractorExpression }: JsonPathPlaygroundProps) {
  const [sampleJson, setSampleJson] = useState("");
  const [preview, setPreview] = useState<PreviewState>({ type: "empty" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPreview(getPreviewState(sampleJson, extractorExpression));
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sampleJson, extractorExpression]);

  return (
    <fieldset className="rounded-md border border-border p-4 space-y-3">
      <legend className="text-sm font-medium px-1">JSONPath playground</legend>
      <p className="text-sm text-muted-foreground">
        Paste sample JSON to preview what the extractor will return at run time.
      </p>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="playground-json">Sample JSON</Label>
          <Textarea
            id="playground-json"
            value={sampleJson}
            onChange={(e) => setSampleJson(e.target.value)}
            placeholder='{ "price": 42000 }'
            className="font-mono min-h-[120px]"
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <p className="text-sm font-medium" id="playground-preview-label">
            Result preview
          </p>
          <PreviewReadout preview={preview} />
        </div>
      </div>
    </fieldset>
  );
}

function PreviewReadout({ preview }: { preview: PreviewState }) {
  if (preview.type === "empty") {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Enter sample JSON above to preview extraction.
      </p>
    );
  }

  if (preview.type === "error") {
    return (
      <p className="text-sm text-destructive" role="alert" aria-live="assertive">
        {preview.message}
      </p>
    );
  }

  if (preview.type === "no-matches") {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        No matches
      </p>
    );
  }

  return (
    <div className="space-y-2" aria-live="polite">
      <p className="text-xs text-muted-foreground">Primary value (used by executor):</p>
      <p className="text-sm font-mono bg-muted rounded px-2 py-1 break-all whitespace-pre-wrap">
        {preview.primary}
      </p>
      {preview.all.length > 1 && (
        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer select-none">
            {preview.all.length} matches total
          </summary>
          <ul className="mt-1 space-y-1" aria-label="All matches">
            {preview.all.map((v, i) => (
              <li key={i} className="text-xs font-mono bg-muted rounded px-2 py-0.5 break-all whitespace-pre-wrap">
                {formatJsonPathValue(v)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
