/* eslint-disable lodash/prefer-lodash-method */
import { z } from "zod";

export const jobApplicationSchema = z.object({
  applied: z.string().trim(),
  company: z.string().trim(),
  id: z.string().trim(),
  interviewRounds: z.array(z.string().trim()).nullable().optional(),
  rejected: z.string().trim().nullable().optional(),
  title: z.string().trim(),
  url: z.string().trim(),
});

export type JobApplicationSchema = z.infer<typeof jobApplicationSchema>;
