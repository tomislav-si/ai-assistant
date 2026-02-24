import { Router } from "express";
import { getEmailDigest } from "./email-digest.controller";

export const emailDigestRouter = Router();

emailDigestRouter.get("/email-digest", getEmailDigest);
