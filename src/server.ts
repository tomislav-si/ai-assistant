import "dotenv/config";
import "./instrumentation";
import { createApp } from "./app";
import { logSampleVectorStoreEntry } from "./db/in-memory/vector-store-utils";
import { emailDigestService } from "./modules/email-digest/email-digest.service";
import { transcriptCommitmentsService } from "./modules/transcript-commitments/transcript-commitments.service";
import { ingestTranscripts } from "./modules/ingest-data";

const PORT = process.env.PORT ?? 3000;
const app = createApp();



async function bootstrap(): Promise<void> {
  console.log("Bootstrapping server...");
  const vectorStore = await ingestTranscripts();
  console.log("Transcripts ingested successfully");

  /**
   * Currently unnecessary because data is static. Processing strategy to be determined:
   * interval-based, event-based, webhook-based, or other.
   */
  // emailDigestService.startBackgroundRefresh();
  transcriptCommitmentsService.startBackgroundRefresh(vectorStore);


  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
