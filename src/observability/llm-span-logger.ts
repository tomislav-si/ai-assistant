/**
 * Custom span exporter that logs a human-readable LLM metrics summary to console.
 * Complements the standard ConsoleSpanExporter with focused, actionable metrics.
 */
import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";
import type { SpanExporter } from "@opentelemetry/sdk-trace-base";
import { ExportResult, ExportResultCode } from "@opentelemetry/core";

const AI_SPAN_PREFIXES = ["ai.generateText", "ai.generateObject", "ai.streamText", "ai.streamObject"];

function isAISpan(spanName: string): boolean {
  return AI_SPAN_PREFIXES.some((prefix) => spanName.startsWith(prefix));
}

function getAttr<T>(span: ReadableSpan, key: string): T | undefined {
  return span.attributes[key] as T | undefined;
}

export class LLMSpanLogger implements SpanExporter {
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    for (const span of spans) {
      if (isAISpan(span.name)) {
        this.logLLMSummary(span);
      }
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  private logLLMSummary(span: ReadableSpan): void {
    const promptTokens = getAttr<number>(span, "ai.usage.promptTokens") ?? getAttr<number>(span, "gen_ai.usage.input_tokens");
    const completionTokens = getAttr<number>(span, "ai.usage.completionTokens") ?? getAttr<number>(span, "gen_ai.usage.output_tokens");
    const model = getAttr<string>(span, "ai.model.id") ?? getAttr<string>(span, "gen_ai.response.model") ?? "unknown";
    const provider = getAttr<string>(span, "ai.model.provider") ?? "unknown";
    const finishReason = getAttr<string>(span, "ai.response.finishReason") ?? getAttr<string>(span, "gen_ai.response.finish_reasons");
    const functionId = getAttr<string>(span, "ai.telemetry.functionId");
    const durationMs = span.duration ? span.duration[0] * 1000 + span.duration[1] / 1e6 : 0;

    const lines: string[] = [
      "",
      "┌─ LLM Call Metrics ─────────────────────────────────",
      `│ Span: ${span.name}`,
      `│ Model: ${provider}/${model}`,
      ...(functionId ? [`│ Function: ${functionId}`] : []),
      `│ Duration: ${durationMs.toFixed(0)}ms`,
      `│ Tokens: ${promptTokens ?? "?"} prompt → ${completionTokens ?? "?"} completion`,
      ...(completionTokens && durationMs ? [`│ Throughput: ${(completionTokens / (durationMs / 1000)).toFixed(1)} tokens/s`] : []),
      ...(finishReason ? [`│ Finish: ${finishReason}`] : []),
      `└─────────────────────────────────────────────────────`,
    ];

    console.log(lines.join("\n"));
  }
}
