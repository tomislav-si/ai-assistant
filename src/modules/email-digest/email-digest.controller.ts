import { Request, Response } from "express";
import { EmailDigestService } from "./email-digest.service";

const emailDigestService = new EmailDigestService();

export async function getEmailDigest(_req: Request, res: Response): Promise<void> {
  try {
    const digest = await emailDigestService.getDigest();
    res.json(digest);
  } catch (error) {
    console.error("Email digest error:", error);
    res.status(500).json({
      error: "Failed to generate email digest",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
