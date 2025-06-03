import isString from "lodash/isString";
import { DateTime } from "luxon";

import { getPrismaClient } from "../../prisma-client.ts";

export const getUserStatsData = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  const prismaClient = getPrismaClient(environment);
  const timezone = isString(request.cf?.timezone) ? request.cf.timezone : "UTC";

  const [topCompanies, allUserApplications, totalApplications, totalCompanies] =
    await Promise.all([
      prismaClient.applications.groupBy({
        _count: { id: true },
        by: ["company"],
        orderBy: { _count: { id: "desc" } },
        take: 5,
        where: { userId },
      }),
      prismaClient.applications.findMany({
        orderBy: { applied: "desc" },
        select: {
          applied: true,
          interviewRounds: {
            orderBy: { dateTime: "desc" },
            select: { dateTime: true },
          },
          rejected: true,
        },
        where: {
          applied: {
            gte: DateTime.now()
              .set({ hour: 0, millisecond: 0, minute: 0, second: 0 })
              .setZone(timezone)
              .minus({ day: 30 })
              .toJSDate(),
          },
          userId,
        },
      }),
      prismaClient.applications.aggregate({
        _count: { _all: true },
        where: { userId },
      }),
      prismaClient.applications.groupBy({
        by: ["company"],
        where: { userId },
      }),
    ]);

  return {
    allUserApplications,
    topCompanies,
    totalApplications,
    totalCompanies,
  };
};
