/**
 * OpenTelemetry instrumentation - must run before any application code.
 * Logs traces and metrics to console for learning and local development.
 *
 * Captures:
 * - LLM calls (token usage, latency, model, finish reason) via AI SDK telemetry
 * - HTTP requests (Express) via auto-instrumentation
 *
 * OPT-IN FOR MORE DETAIL:
 * - recordInputs/recordOutputs: In each generateText/streamText call, set experimental_telemetry
 *   { recordInputs: true, recordOutputs: true } to include full prompts and LLM responses in spans.
 * - Full raw spans: Replace CondensedSpanExporter with ConsoleSpanExporter from
 *   @opentelemetry/sdk-trace-node for complete OpenTelemetry span output (verbose).
 * - Metrics: Add metricReaders with PeriodicExportingMetricReader + ConsoleMetricExporter
 *   to log HTTP, V8 memory, GC metrics every N seconds.
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { LLMSpanLogger } from "./observability/llm-span-logger";
import { CondensedSpanExporter } from "./observability/condensed-span-exporter";

const resource = resourceFromAttributes({
  "service.name": "ai-assistant",
});

const sdk = new NodeSDK({
  resource,
  spanProcessors: [
    new SimpleSpanProcessor(new LLMSpanLogger()),
    new BatchSpanProcessor(new CondensedSpanExporter()),
  ],
  instrumentations: [
    // Captures HTTP, Express, and other Node.js libs
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
    }),
  ],
});

sdk.start();
