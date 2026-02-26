import { PromptTemplate } from "@langchain/core/prompts";

export const BASIC_COMMITMENT_EXTRACTION = `You are an assistant that extracts commitments from meeting transcripts. Given transcript entries (participant name, text, startTime/endTime), list every commitment: who said they will do something, what they will do, and by when. Use the mentioned deadline or infer from "today", "tomorrow", "Friday", etc.`;

export const MR_TRANSCRIPT_CHUNK = new PromptTemplate({
  template: `---
Analyze the following transcript excerpt and list every commitment, action item, or promise made. For each, identify the Owner and any mentioned Deadline. If no commitments are found, return 'NO_COMMITMENTS'.

---
{text}
---
`,
  inputVariables: ["text"],
});

export const MR_TRANSCRIPT_SUMMARY = new PromptTemplate({
  template: `---
The following is a list of extracted commitments from different parts of a meeting. Consolidate them into a JSON object with this exact format (no other text):
{{"commitments":[{{"person":"Name","action":"What they will do","deadline":"When (infer from context or use 'Not specified')"}}]}}

Remove duplicates. If the input is only 'NO_COMMITMENTS', return {{"commitments":[]}}.

---
{text}
---
`,
  inputVariables: ["text"],
});
