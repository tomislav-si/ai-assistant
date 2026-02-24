import { Router } from "express";
import { getTranscriptCommitments } from "./transcript-commitments.controller";

export const transcriptCommitmentsRouter = Router();

transcriptCommitmentsRouter.get("/transcript-commitments", getTranscriptCommitments);
