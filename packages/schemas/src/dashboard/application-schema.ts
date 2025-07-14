/* eslint-disable lodash/prefer-lodash-method */
import { z } from "zod";

export const applicationSchema = z.object({
  applied: z.string().trim(),
  company: z.string().trim(),
  id: z.string().trim(),
  jobBoardUrl: z.string().trim().optional().nullable(),
  rejected: z.string().trim().nullable(),
  title: z.string().trim(),
  url: z.string().trim(),
  userId: z.string().trim(),
});

export const getAllApplicationsSchema = z.object({
  data: z.array(applicationSchema),
  pagination: z.object({
    limit: z.number(),
    page: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const createApplicationSchema = applicationSchema.omit({
  id: true,
});

export const deleteApplicationSchema = z.object({
  id: z.string(),
});

export const updateApplicationSchema = applicationSchema;

export type CreateJobApplication = z.infer<typeof createApplicationSchema>;
export type DeleteJobApplication = z.infer<typeof deleteApplicationSchema>;
export type JobApplication = z.infer<typeof applicationSchema>;
export type UpdateJobApplication = z.infer<typeof updateApplicationSchema>;
