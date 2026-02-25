import "./instrumentation";
import { createApp } from "./app";
import { emailDigestService } from "./modules/email-digest/email-digest.service";
import { transcriptCommitmentsService } from "./modules/transcript-commitments/transcript-commitments.service";

const PORT = process.env.PORT ?? 3000;
const app = createApp();

/**
 * Currently unnecessary because data is static. Processing strategy to be determined:
 * interval-based, event-based, webhook-based, or other.
 */
emailDigestService.startBackgroundRefresh();
transcriptCommitmentsService.startBackgroundRefresh();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
