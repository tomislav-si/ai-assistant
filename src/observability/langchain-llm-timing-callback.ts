/**
 * LangChain callback handler that logs per-prompt LLM metrics to console.
 * Complements LLMSpanLogger (OpenTelemetry) for chains that use LangChain instead of the AI SDK.
 * Use with chain.invoke(input, { callbacks: [langChainLLMTimingCallback] }).
 */
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";

export const langChainLLMTimingCallback = new (class extends BaseCallbackHandler {
  name = "langchain-llm-timing";
  private startTimes = new Map<string, number>();

  async handleChatModelStart(_llm: unknown, _messages: unknown[][], runId: string) {
    this.startTimes.set(runId, Date.now());
  }

  async handleLLMStart(_llm: unknown, _prompts: string[], runId: string) {
    this.startTimes.set(runId, Date.now());
  }

  async handleLLMEnd(output: LLMResult, runId: string) {
    const start = this.startTimes.get(runId);
    if (start) {
      const durationMs = Date.now() - start;
      const llmTokenUsage = output?.llmOutput?.tokenUsage as
        | { promptTokens?: number; completionTokens?: number }
        | undefined;
      const msgUsage = (output?.generations?.[0]?.[0] as { message?: { usage_metadata?: { input_tokens?: number; output_tokens?: number } } })?.message?.usage_metadata;
      const promptTokens = llmTokenUsage?.promptTokens ?? msgUsage?.input_tokens;
      const completionTokens = llmTokenUsage?.completionTokens ?? msgUsage?.output_tokens;
      const throughput =
        completionTokens && durationMs > 0
          ? ` | ${(completionTokens / (durationMs / 1000)).toFixed(1)} tokens/s`
          : "";
      const tokenLine =
        promptTokens != null || completionTokens != null
          ? `│ Tokens: ${promptTokens ?? "?"} prompt → ${completionTokens ?? "?"} completion${throughput}`
          : "";
      const lines = [
        "",
        "┌─ LangChain LLM Call ─────────────────────────────────",
        `│ Duration: ${durationMs.toFixed(0)}ms`,
        tokenLine,
        "└─────────────────────────────────────────────────────",
      ].filter(Boolean);
      console.log(lines.join("\n"));
      this.startTimes.delete(runId);
    }
  }
})();
