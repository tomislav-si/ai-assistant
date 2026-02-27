import path from "node:path";

/**
 * Central configuration loaded from environment variables.
 * All Ollama, transcript, and refresh settings in one place.
 */

function env(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function envInt(key: string, defaultValue: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : defaultValue;
}

function envBool(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];
  if (val === undefined || val === "") return defaultValue;
  return /^(1|true|yes)$/i.test(val.trim());
}

export const config = {
  /** Ollama API base URL (no trailing slash) */
  OLLAMA_BASE_URL: env("OLLAMA_BASE_URL", "http://localhost:11434"),

  /** Ollama chat/completion model */
  OLLAMA_MODEL: env("OLLAMA_MODEL", "qwen3:8b"),

  /** Ollama embedding model */
  OLLAMA_EMBEDDING_MODEL: env("OLLAMA_EMBEDDING_MODEL", "bge-m3:latest"),

  /** LLM provider for extractCommitments map-reduce: "ollama" | "openai" */
  LLM_PROVIDER: env("LLM_PROVIDER", "ollama") as "ollama" | "openai",

  /** OpenAI model (used when LLM_PROVIDER=openai) */
  OPENAI_MODEL: env("OPENAI_MODEL", "gpt-4o-mini"),

  /** OpenAI API key (required when LLM_PROVIDER=openai) */
  OPENAI_API_KEY: env("OPENAI_API_KEY", ""),

  /** Chunk size for RecursiveCharacterTextSplitter */
  CHUNK_SIZE: envInt("CHUNK_SIZE", 1000),

  /** Chunk overlap for RecursiveCharacterTextSplitter */
  CHUNK_OVERLAP: envInt("CHUNK_OVERLAP", 200),

  /** Directory containing transcript JSON files (resolved from cwd) */
  TRANSCRIPTS_DIR: (() => {
    const dir = env("TRANSCRIPTS_DIR", path.join("src", "mock-data", "transcripts"));
    return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
  })(),

  /** Full transcript filename */
  TRANSCRIPT_FULL: env("TRANSCRIPT_FULL", "meeting-transcript.json"),

  /** Small transcript filename (for faster testing) */
  TRANSCRIPT_SMALL: env("TRANSCRIPT_SMALL", "meeting-transcript-small.json"),

  /** Enable email digest background refresh */
  EMAIL_REFRESH_ENABLED: envBool("EMAIL_REFRESH_ENABLED", true),

  /** Enable transcript commitments background refresh */
  TRANSCRIPT_REFRESH_ENABLED: envBool("TRANSCRIPT_REFRESH_ENABLED", true),

  /** Enable basic transcript commitments extraction (Vercel AI SDK) */
  TRANSCRIPT_COMMITMENTS_BASIC_ENABLED: envBool("TRANSCRIPT_COMMITMENTS_BASIC_ENABLED", true),

  /** Enable map-reduce transcript commitments extraction */
  TRANSCRIPT_COMMITMENTS_MAP_REDUCE_ENABLED: envBool("TRANSCRIPT_COMMITMENTS_MAP_REDUCE_ENABLED", false),

  /** Email digest background refresh interval in milliseconds */
  EMAIL_REFRESH_INTERVAL_MS: envInt("EMAIL_REFRESH_INTERVAL_MS", 15 * 60 * 1000),

  /** Transcript commitments background refresh interval in milliseconds */
  TRANSCRIPT_REFRESH_INTERVAL_MS: envInt("TRANSCRIPT_REFRESH_INTERVAL_MS", 15 * 60 * 1000),
} as const;
