/* eslint-disable lodash/prefer-lodash-method */
import { z } from "zod";

export const applicationSchema = z.object({
  applied: z.string().trim(),
  company: z.string().trim(),
  id: z.string().trim(),
  interviewRounds: z.array(z.string().trim()).nullable().optional(),
  rejected: z.string().trim().nullable().optional(),
  title: z.string().trim(),
  url: z.string().trim(),
  userId: z.string().trim(),
});

export const createApplicationSchema = applicationSchema.omit({
  id: true,
});

export const deleteApplicationSchema = z.object({
  id: z.string(),
  userId: z.string(),
});

export type CreateJobApplication = z.infer<typeof createApplicationSchema>;
export type JobApplication = z.infer<typeof applicationSchema>;
