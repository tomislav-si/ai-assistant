import "dotenv/config";
import "./instrumentation";
import { createApp } from "./app";
import { config } from "./config";
import { emailDigestService } from "./modules/email-digest/email-digest.service";
import { transcriptCommitmentsService } from "./modules/transcript-commitments/transcript-commitments.service";
import { ingestTranscripts } from "./modules/ingest-data";

const PORT = process.env.PORT ?? 3000;
const app = createApp();

async function bootstrap(): Promise<void> {
  console.log("Bootstrapping server...");
  const vectorStore = await ingestTranscripts();
  console.log("Transcripts ingested successfully");

  if (config.EMAIL_REFRESH_ENABLED) {
    emailDigestService.startBackgroundRefresh();
  }
  if (config.TRANSCRIPT_REFRESH_ENABLED) {
    transcriptCommitmentsService.startBackgroundRefresh(vectorStore);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
