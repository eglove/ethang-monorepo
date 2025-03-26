import { z } from "zod";

export const statsSchema = z.object({
  applicationsPerDay: z.array(
    z.object({
      count: z.number(),
      date: z.string(),
    }),
  ),
  averageApplicationsPerDay: z.number(),
  averageResponseRate: z.number(),
  averageTimeToInterview: z.number().nullable(),
  averageTimeToRejection: z.number().nullable(),
  topCompanies: z.array(
    z.object({
      company: z.string(),
      count: z.number(),
    }),
  ),
  totalApplications: z.number(),
  totalCompanies: z.number(),
});

export type StatsSchema = z.infer<typeof statsSchema>;
