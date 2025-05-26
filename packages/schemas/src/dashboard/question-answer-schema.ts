/* eslint-disable lodash/prefer-lodash-method */
import { z } from "zod";

export const questionAnswerSchema = z.object({
  answer: z.string().trim(),
  id: z.string().trim(),
  question: z.string().trim(),
  userId: z.string().trim(),
});

export const createQuestionAnswerSchema = questionAnswerSchema.omit({
  id: true,
});

export const deleteQuestionAnswerSchema = z.object({
  id: z.string(),
  userId: z.string(),
});

export type CreateQuestionAnswer = z.infer<typeof createQuestionAnswerSchema>;
export type QuestionAnswer = z.infer<typeof questionAnswerSchema>;
