import { Request, Response } from "express";
import { TranscriptCommitmentsService } from "./transcript-commitments.service";

const transcriptCommitmentsService = new TranscriptCommitmentsService();

export async function getTranscriptCommitments(_req: Request, res: Response): Promise<void> {
  try {
    const commitments = await transcriptCommitmentsService.getCommitments();
    res.json(commitments);
  } catch (error) {
    console.error("Transcript commitments error:", error);
    res.status(500).json({
      error: "Failed to extract transcript commitments",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
