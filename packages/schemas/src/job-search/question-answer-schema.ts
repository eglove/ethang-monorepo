/* eslint-disable lodash/prefer-lodash-method */
import { z } from "zod";

export const questionAnswerSchema = z.object({
  answer: z.string().trim(),
  id: z.string().trim(),
  question: z.string().trim(),
});

export type QuestionAnswerSchema = z.infer<typeof questionAnswerSchema>;
