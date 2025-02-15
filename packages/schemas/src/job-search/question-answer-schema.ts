import { z } from "zod";

export const questionAnswerSchema = z.object({
  answer: z.string(),
  id: z.string(),
  question: z.string(),
});

export type QuestionAnswerSchema = z.infer<typeof questionAnswerSchema>;
