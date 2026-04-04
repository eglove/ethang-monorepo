import { z } from "zod";

// Structured JSON output protocol: what the LLM returns each turn
export const QuestionerMessageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(["question", "summary", "signoff"]),
});

export type QuestionerMessage = z.infer<typeof QuestionerMessageSchema>;

// Artifact schema for store validation
export const QuestionAnswerSchema = z.object({
  answer: z.string(),
  question: z.string(),
});

export const QuestionerArtifactSchema = z.object({
  artifactState: z.enum(["empty", "partial", "complete"]),
  questions: z.array(QuestionAnswerSchema),
  sessionState: z.enum([
    "questioning",
    "awaitingInput",
    "summaryPresented",
    "signingOff",
    "completed",
    "failed",
  ]),
  summary: z.string().nullable(),
  turnCount: z.number().int().min(0),
});
