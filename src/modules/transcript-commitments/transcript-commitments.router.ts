import { Router } from "express";
import {
  getTranscriptCommitments,
  getMapReduceTranscriptCommitments,
} from "./transcript-commitments.controller";

export const transcriptCommitmentsRouter = Router();

transcriptCommitmentsRouter.get("/transcript-commitments", getTranscriptCommitments);
transcriptCommitmentsRouter.get("/mr-transcript-commitments", getMapReduceTranscriptCommitments);
