import * as fs from "fs";
import * as path from "path";
import { createOllama } from "ollama-ai-provider-v2";
import { generateText, Output } from "ai";
import { z } from "zod";

const OLLAMA_BASE_URL = "http://localhost:11434";
const OLLAMA_MODEL = "qwen3:8b";

const TRANSCRIPT_SYSTEM_PROMPT = `You are an assistant that extracts commitments from meeting transcripts. Given transcript entries (participant name, text, startTime/endTime), list every commitment: who said they will do something, what they will do, and by when. Use the mentioned deadline or infer from "today", "tomorrow", "Friday", etc.`;

const transcriptCommitmentsSchema = z.object({
  commitments: z.array(
    z.object({
      person: z.string().describe("Name of the person who made the commitment"),
      action: z.string().describe("What they will do"),
      deadline: z.string().describe("When (use mentioned deadline or infer from context)"),
    })
  ),
});

export type Commitment = z.infer<typeof transcriptCommitmentsSchema>["commitments"][number];
export type TranscriptCommitments = z.infer<typeof transcriptCommitmentsSchema>;

function getMockDataPath(): string {
  const fromCwd = path.join(process.cwd(), "src", "mock-data", "transcripts", "meeting-transcript.json");
  if (fs.existsSync(fromCwd)) return fromCwd;
  return path.join(process.cwd(), "mock-data", "transcripts", "meeting-transcript.json");
}

function loadTranscript(): string {
  const filePath = getMockDataPath();
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as { entries: Array<Record<string, unknown>> };
  return JSON.stringify(data.entries, null, 2);
}

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export class TranscriptCommitmentsService {
  private cache: TranscriptCommitments | null = null;
  private lastFetchAt: Date | null = null;

  private async generateAndCache(): Promise<void> {
    try {
      const content = loadTranscript();

      const ollama = createOllama({
        baseURL: `${OLLAMA_BASE_URL}/api`,
      });

      const { output } = await generateText({
        model: ollama(OLLAMA_MODEL),
        system: TRANSCRIPT_SYSTEM_PROMPT,
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

      this.cache = output;
      this.lastFetchAt = new Date();
      console.log(`Transcript commitments cached at ${this.lastFetchAt.toISOString()}`);
    } catch (error) {
      console.error("Transcript commitments refresh error:", error);
    }
  }

  getCachedCommitments(): { commitments: TranscriptCommitments; lastFetchAt: Date } | null {
    if (this.cache === null || this.lastFetchAt === null) return null;
    return { commitments: this.cache, lastFetchAt: this.lastFetchAt };
  }

  /**
   * Currently unnecessary because data is static (mock files).
   * Processing strategy to be determined: interval-based, event-based,
   * webhook-based, or other.
   */
  startBackgroundRefresh(): void {
    console.log("Starting transcript commitments background refresh (interval: 15 minutes)");
    this.generateAndCache();
    setInterval(() => this.generateAndCache(), REFRESH_INTERVAL_MS);
  }
}

export const transcriptCommitmentsService = new TranscriptCommitmentsService();
