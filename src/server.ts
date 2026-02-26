import "./instrumentation";
import { createApp } from "./app";
import { emailDigestService } from "./modules/email-digest/email-digest.service";
import { transcriptCommitmentsService } from "./modules/transcript-commitments/transcript-commitments.service";
import { ingestTranscripts } from "./modules/transcript-ingestion/ingest-transcripts";

const PORT = process.env.PORT ?? 3000;
const app = createApp();

/**
 * Currently unnecessary because data is static. Processing strategy to be determined:
 * interval-based, event-based, webhook-based, or other.
 */
emailDigestService.startBackgroundRefresh();
transcriptCommitmentsService.startBackgroundRefresh();

async function bootstrap(): Promise<void> {
  const vectorStore = await ingestTranscripts();

  // Test the transcript ingestion
  // const [sample] = await vectorStore.similaritySearch("meeting", 1);
  // if (sample) {
  //   console.log("[Transcript ingestion] Sample entry:", {
  //     pageContent: sample.pageContent.slice(0, 150) + "...",
  //     metadata: sample.metadata,
  //   });
  // }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
