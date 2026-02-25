/**
 * Condensed span exporter - logs spans with minimal repetition.
 * Prints resource once per batch, filters out large attributes (prompts, responses).
 *
 * OPT-IN FOR MORE DETAIL:
 * - Use ConsoleSpanExporter from @opentelemetry/sdk-trace-node for full raw span output
 * - Set recordInputs: true / recordOutputs: true in experimental_telemetry to include
 *   full prompts and LLM responses in span attributes (adds ai.prompt.messages, ai.response.text)
 */
import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";
import type { SpanExporter } from "@opentelemetry/sdk-trace-base";
import { ExportResult, ExportResultCode } from "@opentelemetry/core";

const SKIP_ATTRS = new Set([
  "ai.prompt.messages",
  "ai.prompt",
  "ai.response.text",
  "ai.embeddings",
  "ai.values",
]);

function durationMs(span: ReadableSpan): number {
  if (!span.duration) return 0;
  return span.duration[0] * 1000 + span.duration[1] / 1e6;
}

function filterAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (SKIP_ATTRS.has(k)) continue;
    if (typeof v === "string" && v.length > 200) {
      out[k] = v.slice(0, 200) + "...";
    } else {
      out[k] = v;
    }
  }
  return out;
}

export class CondensedSpanExporter implements SpanExporter {
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    if (spans.length === 0) {
      resultCallback({ code: ExportResultCode.SUCCESS });
      return;
    }

    const traceId = spans[0]?.spanContext().traceId?.slice(0, 16);
    console.log(`\n[Trace ${traceId}...]`);

    for (const span of spans) {
      const ctx = span.spanContext();
      const attrs = filterAttrs(span.attributes as Record<string, unknown>);
      const hasAttrs = Object.keys(attrs).length > 0;

      console.log(
        `  ${span.name} | ${durationMs(span).toFixed(0)}ms | ${ctx.spanId.slice(0, 8)}` +
          (hasAttrs ? ` | ${JSON.stringify(attrs)}` : "")
      );
    }

    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}
