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

export const config = {
  /** Ollama API base URL (no trailing slash) */
  OLLAMA_BASE_URL: env("OLLAMA_BASE_URL", "http://localhost:11434"),

  /** Ollama chat/completion model */
  OLLAMA_MODEL: env("OLLAMA_MODEL", "qwen3:8b"),

  /** Ollama embedding model */
  OLLAMA_EMBEDDING_MODEL: env("OLLAMA_EMBEDDING_MODEL", "bge-m3:latest"),

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

  /** Email digest background refresh interval in milliseconds */
  EMAIL_REFRESH_INTERVAL_MS: envInt("EMAIL_REFRESH_INTERVAL_MS", 15 * 60 * 1000),

  /** Transcript commitments background refresh interval in milliseconds */
  TRANSCRIPT_REFRESH_INTERVAL_MS: envInt("TRANSCRIPT_REFRESH_INTERVAL_MS", 15 * 60 * 1000),
} as const;
