import { z } from "zod";

export const jobApplicationSchema = z.object({
  applied: z.string(),
  company: z.string(),
  id: z.string(),
  interviewRounds: z.array(z.string()).optional(),
  rejected: z.string().optional(),
  title: z.string(),
  url: z.string(),
});

export type JobApplicationSchema = z.infer<typeof jobApplicationSchema>;
