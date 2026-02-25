import { Request, Response } from "express";
import { emailDigestService } from "./email-digest.service";

export async function getEmailDigest(_req: Request, res: Response): Promise<void> {
  const cached = emailDigestService.getCachedDigest();
  if (cached === null) {
    res.status(503).json({
      error: "No digest available",
      message: "Digest has not been generated yet. It will be available shortly after the first background refresh completes.",
    });
    return;
  }
  res.json({ ...cached.digest, lastFetchAt: cached.lastFetchAt.toISOString() });
}
