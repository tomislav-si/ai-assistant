import express, { Application } from "express";
import { emailDigestRouter } from "./modules/email-digest/email-digest.router";
import { transcriptCommitmentsRouter } from "./modules/transcript-commitments/transcript-commitments.router";

export function createApp(): Application {
  const app = express();

  app.use(express.json());

  // Mount module routers
  app.use("/api", emailDigestRouter);
  app.use("/api", transcriptCommitmentsRouter);

  // Root route
  app.get("/", (_req, res) => {
    res.json({ message: "Hello World!", status: "ok" });
  });

  return app;
}
