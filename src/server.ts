import "./instrumentation";
import { createApp } from "./app";
import { emailDigestService } from "./modules/email-digest/email-digest.service";
import { transcriptCommitmentsService } from "./modules/transcript-commitments/transcript-commitments.service";

const PORT = process.env.PORT ?? 3000;
const app = createApp();

emailDigestService.startBackgroundRefresh();
transcriptCommitmentsService.startBackgroundRefresh();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
