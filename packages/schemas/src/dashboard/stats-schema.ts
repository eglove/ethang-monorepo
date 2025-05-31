import { z } from "zod";

export const userStatsSchema = z.object({
  averageApplicationsPerDay: z.number(),
  averageResponseRate: z.number(),
  averageTimeToInterview: z.number(),
  averageTimeToRejected: z.number(),
  topCompanies: z.array(
    z.object({
      _count: z.object({
        id: z.number(),
      }),
      company: z.string(),
    }),
  ),
  totalApplications: z.number(),
  totalCompanies: z.number(),
  userDailyApplications: z.array(
    z.object({
      date: z.string(),
      totalApplications: z.number(),
    }),
  ),
});

export type UserStats = z.output<typeof userStatsSchema>;
