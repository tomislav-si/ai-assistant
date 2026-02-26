import { Request, Response } from "express";
import { transcriptCommitmentsService } from "./transcript-commitments.service";

export async function getTranscriptCommitments(_req: Request, res: Response): Promise<void> {
  const cached = transcriptCommitmentsService.getBasicCachedCommitments();
  if (cached === null) {
    res.status(503).json({
      error: "No commitments available",
      message:
        "Commitments have not been extracted yet. They will be available shortly after the first background refresh completes.",
    });
    return;
  }
  res.json({ ...cached.commitments, lastFetchAt: cached.lastFetchAt.toISOString() });
}

export async function getMapReduceTranscriptCommitments(_req: Request, res: Response): Promise<void> {
  const cached = transcriptCommitmentsService.getMapReduceCachedCommitments();
  if (cached === null) {
    res.status(503).json({
      error: "No map-reduce commitments available",
      message:
        "Map-reduce commitments have not been extracted yet. They will be available shortly after the first background refresh completes.",
    });
    return;
  }
  res.json({ ...cached.commitments, lastFetchAt: cached.lastFetchAt.toISOString() });
}
