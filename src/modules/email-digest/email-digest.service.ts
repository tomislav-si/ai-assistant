import * as fs from "fs";
import * as path from "path";
import { createOllama } from "ollama-ai-provider-v2";
import { generateText, Output } from "ai";
import { z } from "zod";

import { config } from "../../config";

const EMAIL_SYSTEM_PROMPT = `You are an assistant that produces concise email digests. Given a list of emails (with from, subject, date, snippet, labels), extract a structured digest: group by topic or sender if useful, summarize each thread or message in 1–2 sentences, and highlight any urgent or action items.`;

const emailDigestSchema = z.object({
  summary: z.string().describe("Brief overall summary in 1-2 sentences"),
  groups: z.array(
    z.object({
      topic: z.string().describe("Topic or sender name"),
      items: z.array(
        z.object({
          subject: z.string().describe("Email subject"),
          summary: z.string().describe("1-2 sentence summary"),
          isUrgent: z.boolean().describe("Whether the item requires urgent attention"),
        })
      ),
    })
  ),
  actionItems: z.array(z.string()).describe("List of action items extracted from emails"),
});

export type DigestItem = z.infer<typeof emailDigestSchema>["groups"][number]["items"][number];
export type DigestGroup = z.infer<typeof emailDigestSchema>["groups"][number];
export type EmailDigest = z.infer<typeof emailDigestSchema>;

function getMockDataPath(): string {
  const fromCwd = path.join(process.cwd(), "src", "mock-data", "emails", "gmail-mock-data.json");
  if (fs.existsSync(fromCwd)) return fromCwd;
  return path.join(process.cwd(), "mock-data", "emails", "gmail-mock-data.json");
}

function loadEmails(): string {
  const filePath = getMockDataPath();
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as { messages: Array<Record<string, unknown>> };
  return JSON.stringify(data.messages, null, 2);
}

export class EmailDigestService {
  private cache: EmailDigest | null = null;
  private lastFetchAt: Date | null = null;

  private async generateAndCache(): Promise<void> {
    try {
      const content = loadEmails();

      const ollama = createOllama({
        baseURL: `${config.OLLAMA_BASE_URL}/api`,
      });

      const { output } = await generateText({
        model: ollama(config.OLLAMA_MODEL),
        system: EMAIL_SYSTEM_PROMPT,
        prompt: `Process the following emails and return the structured digest.\n\nContent:\n${content}`,
        output: Output.object({
          schema: emailDigestSchema,
          name: "EmailDigest",
          description: "Structured email digest with summary, grouped items, and action items",
        }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: "email-digest",
          recordInputs: false,
          recordOutputs: false,
          metadata: {
            module: "email-digest",
            operation: "getDigest",
          },
        },
      });

      this.cache = output;
      this.lastFetchAt = new Date();
      console.log(`Email digest cached at ${this.lastFetchAt.toISOString()}`);
    } catch (error) {
      console.error("Email digest refresh error:", error);
    }
  }

  getCachedDigest(): { digest: EmailDigest; lastFetchAt: Date } | null {
    if (this.cache === null || this.lastFetchAt === null) return null;
    return { digest: this.cache, lastFetchAt: this.lastFetchAt };
  }

  /**
   * Currently unnecessary because data is static (mock files).
   * Processing strategy to be determined: interval-based, event-based,
   * webhook-based, or other.
   */
  startBackgroundRefresh(): void {
    console.log(`Starting email digest background refresh (interval: ${config.EMAIL_REFRESH_INTERVAL_MS}ms)`);
    this.generateAndCache();
    setInterval(() => this.generateAndCache(), config.EMAIL_REFRESH_INTERVAL_MS);
  }
}

export const emailDigestService = new EmailDigestService();
