import * as fs from "fs";
import * as path from "path";

export function getMockDataPath(): string {
  const fromCwd = path.join(process.cwd(), "src", "mock-data", "transcripts", "meeting-transcript.json");
  if (fs.existsSync(fromCwd)) return fromCwd;
  return path.join(process.cwd(), "mock-data", "transcripts", "meeting-transcript.json");
}

export function loadTranscript(): string {
  const filePath = getMockDataPath();
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as { entries: Array<Record<string, unknown>> };
  return JSON.stringify(data.entries, null, 2);
}
