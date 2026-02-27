import { createOllama } from "ollama-ai-provider-v2";
import { generateText, Output } from "ai";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { loadSummarizationChain } from "@langchain/classic/chains";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { Document } from "@langchain/core/documents";

import type { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

import { langChainLLMTimingCallback } from "../../observability/langchain-llm-timing-callback";
import { transcriptCommitmentsSchema, type TranscriptCommitments } from "./types";
import { loadTranscript } from "./utils";
import { BASIC_COMMITMENT_EXTRACTION, MR_TRANSCRIPT_CHUNK, MR_TRANSCRIPT_SUMMARY } from "./prompts";
import { getDocumentsFromVectorStore } from "../../db/in-memory/vector-store-utils";
import { config } from "../../config";

export class TranscriptCommitmentsService {
  private basicCache: TranscriptCommitments | null = null;
  private basicLastFetchAt: Date | null = null;

  private mrCache: TranscriptCommitments | null = null;
  private mrLastFetchAt: Date | null = null;

  private vectorStore: MemoryVectorStore | null = null;

  setVectorStore(store: MemoryVectorStore): void {
    console.log("[TranscriptCommitmentsService] Setting vector store...");
    this.vectorStore = store;
  }

  private async generateBasicTranscriptCommitmentsAndCache(): Promise<void> {
    try {
      const content = loadTranscript();

      const ollama = createOllama({
        baseURL: `${config.OLLAMA_BASE_URL}/api`,
      });

      const { output } = await generateText({
        model: ollama(config.OLLAMA_MODEL),
        system: BASIC_COMMITMENT_EXTRACTION,
        prompt: `Process the following transcript and extract all commitments.\n\nContent:\n${content}`,
        output: Output.object({
          schema: transcriptCommitmentsSchema,
          name: "TranscriptCommitments",
          description: "List of commitments extracted from meeting transcript",
        }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: "transcript-commitments",
          recordInputs: false,
          recordOutputs: false,
          metadata: {
            module: "transcript-commitments",
            operation: "getCommitments",
          },
        },
      });

      this.basicCache = output;
      this.basicLastFetchAt = new Date();
      console.log(`Basic transcript commitments cached at ${this.basicLastFetchAt.toISOString()}`);
    } catch (error) {
      console.error("Basic transcript commitments refresh error:", error);
    }
  }

  private async generateMapReduceTranscriptCommitmentsAndCache(): Promise<void> {
    if (this.vectorStore === null) {
      console.warn("Map-reduce skipped: vector store not set. Call setVectorStore() after ingestTranscripts().");
      return;
    }
    try {
      const docs = getDocumentsFromVectorStore(this.vectorStore);
      const rawResult = await this.extractCommitments(docs);

      this.mrCache = this.parseCommitmentsJson(rawResult);
      this.mrLastFetchAt = new Date();
      console.log(`Map-reduce transcript commitments cached at ${this.mrLastFetchAt.toISOString()}`);
    } catch (error) {
      console.error("Map-reduce transcript commitments refresh error:", error);
    }
  }

  private parseCommitmentsJson(raw: string): TranscriptCommitments {
    try {
      const json = raw.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = transcriptCommitmentsSchema.safeParse(JSON.parse(json));
      return parsed.success ? parsed.data : { commitments: [] };
    } catch {
      return { commitments: [] };
    }
  }

  /**
   * Creates the LLM for map-reduce based on config (LLM_PROVIDER) or optional override.
   * Use options.provider to benchmark different backends without changing env.
   */
  private createMapReduceLLM(providerOverride?: "ollama" | "openai"): BaseChatModel {
    const provider = providerOverride ?? config.LLM_PROVIDER;

    if (provider === "openai") {
      if (!config.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required when LLM_PROVIDER=openai");
      }
      return new ChatOpenAI({
        model: config.OPENAI_MODEL,
        temperature: 0,
        apiKey: config.OPENAI_API_KEY,
      });
    }

    return new ChatOllama({
      model: config.OLLAMA_MODEL,
      temperature: 0,
    });
  }

  /**
   * Extracts meeting commitments from document chunks using a Map-Reduce chain.
   * LLM backend is chosen via LLM_PROVIDER (ollama | openai). Use options.provider to override for benchmarking.
   *
   * @param docs - Array of Document objects (chunks from ingestion phase)
   * @param options - Optional. provider: override config to use "ollama" or "openai" for comparison.
   * @returns Raw string from LLM (JSON expected, to be parsed by parseCommitmentsJson)
   */
  async extractCommitments(
    docs: Document[],
    options?: { provider?: "ollama" | "openai" }
  ): Promise<string> {
    const llm = this.createMapReduceLLM(options?.provider);

    const chain = loadSummarizationChain(llm, {
      type: "map_reduce",
      combineMapPrompt: MR_TRANSCRIPT_CHUNK,
      combinePrompt: MR_TRANSCRIPT_SUMMARY,
    });

    const result = await chain.invoke(
      { input_documents: docs },
      { callbacks: [langChainLLMTimingCallback] }
    );

    return (result?.text as string) ?? "No commitments could be extracted.";
  }

  getBasicCachedCommitments(): { commitments: TranscriptCommitments; lastFetchAt: Date } | null {
    if (this.basicCache === null || this.basicLastFetchAt === null) return null;
    return { commitments: this.basicCache, lastFetchAt: this.basicLastFetchAt };
  }

  getMapReduceCachedCommitments(): { commitments: TranscriptCommitments; lastFetchAt: Date } | null {
    if (this.mrCache === null || this.mrLastFetchAt === null) return null;
    return { commitments: this.mrCache, lastFetchAt: this.mrLastFetchAt };
  }

  /**
   * Currently unnecessary because data is static (mock files).
   * Processing strategy to be determined: interval-based, event-based,
   * webhook-based, or other.
   *
   * @param vectorStore - Optional. If provided, sets the vector store before running the first refresh.
   *                     Pass the store from ingestTranscripts() to ensure map-reduce has chunks available.
   */
  startBackgroundRefresh(vectorStore?: MemoryVectorStore): void {
    if (vectorStore) {
      this.setVectorStore(vectorStore);
    }
    const basicEnabled = config.TRANSCRIPT_COMMITMENTS_BASIC_ENABLED;
    const mrEnabled = config.TRANSCRIPT_COMMITMENTS_MAP_REDUCE_ENABLED;
    if (!basicEnabled && !mrEnabled) {
      console.log("[TranscriptCommitmentsService] Both basic and map-reduce disabled, skipping background refresh");
      return;
    }
    console.log(
      `Starting transcript commitments background refresh (interval: ${config.TRANSCRIPT_REFRESH_INTERVAL_MS / 60_000} min, basic: ${basicEnabled}, map-reduce: ${mrEnabled})`
    );
    if (basicEnabled) this.generateBasicTranscriptCommitmentsAndCache();
    if (mrEnabled) this.generateMapReduceTranscriptCommitmentsAndCache();
    setInterval(() => {
      if (basicEnabled) this.generateBasicTranscriptCommitmentsAndCache();
      if (mrEnabled) this.generateMapReduceTranscriptCommitmentsAndCache();
    }, config.TRANSCRIPT_REFRESH_INTERVAL_MS);
  }
}

export const transcriptCommitmentsService = new TranscriptCommitmentsService();
