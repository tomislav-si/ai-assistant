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
  const fromCwd = path.join(process.cwd(), "src", "mock-data", "meeting-transcript.json");
  if (fs.existsSync(fromCwd)) return fromCwd;
  return path.join(process.cwd(), "mock-data", "meeting-transcript.json");
}

function loadTranscript(): string {
  const filePath = getMockDataPath();
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as { entries: Array<Record<string, unknown>> };
  return JSON.stringify(data.entries, null, 2);
}

export class TranscriptCommitmentsService {
  async getCommitments(): Promise<TranscriptCommitments> {
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
        // OPT-IN: Set to true to include full prompts in span attributes (ai.prompt.messages).
        // Useful for debugging but adds large payloads to traces.
        recordInputs: false,
        // OPT-IN: Set to true to include full LLM response in span attributes (ai.response.text).
        // Useful for debugging but adds large payloads to traces.
        recordOutputs: false,
        metadata: {
          module: "transcript-commitments",
          operation: "getCommitments",
        },
      },
    });

    return output;
  }
}
