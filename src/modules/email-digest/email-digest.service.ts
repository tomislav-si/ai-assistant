import * as fs from "fs";
import * as path from "path";
import { createOllama } from "ollama-ai-provider-v2";
import { generateText, Output } from "ai";
import { z } from "zod";

const OLLAMA_BASE_URL = "http://localhost:11434";
const OLLAMA_MODEL = "qwen3:8b";

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
  const fromCwd = path.join(process.cwd(), "src", "mock-data", "gmail-mock-data.json");
  if (fs.existsSync(fromCwd)) return fromCwd;
  return path.join(process.cwd(), "mock-data", "gmail-mock-data.json");
}

function loadEmails(): string {
  const filePath = getMockDataPath();
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as { messages: Array<Record<string, unknown>> };
  return JSON.stringify(data.messages, null, 2);
}

export class EmailDigestService {
  async getDigest(): Promise<EmailDigest> {
    const content = loadEmails();

    const ollama = createOllama({
      baseURL: `${OLLAMA_BASE_URL}/api`,
    });

    const { output } = await generateText({
      model: ollama(OLLAMA_MODEL),
      system: EMAIL_SYSTEM_PROMPT,
      prompt: `Process the following emails and return the structured digest.\n\nContent:\n${content}`,
      output: Output.object({
        schema: emailDigestSchema,
        name: "EmailDigest",
        description: "Structured email digest with summary, grouped items, and action items",
      }),
    });

    return output;
  }
}
