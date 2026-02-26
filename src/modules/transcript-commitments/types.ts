import { z } from "zod";

export const transcriptCommitmentsSchema = z.object({
  commitments: z.array(
    z.object({
      person: z.string().describe("Name of the person who made the commitment"),
      action: z.string().describe("What they will do"),
      deadline: z.string().describe("When (use mentioned deadline or infer from context)"),
    })
  ),
});

export type Commitment = z.infer<typeof transcriptCommitmentsSchema>["commitments"][number];
export type TranscriptCommitments = z.infer<typeof transcriptCommitmentsSchema>;
