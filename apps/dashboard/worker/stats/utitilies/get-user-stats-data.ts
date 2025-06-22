import type { JobApplication } from "@ethang/schemas/src/dashboard/application-schema.ts";

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

  const thirtyDaysAgo = DateTime.now()
    .setZone(timezone)
    .startOf("day")
    .minus({ day: 30 })
    .toISO();

  const allUserApplicationsQuery = `select
  T1.applied,
  T1.rejected,
  T2.dateTime AS interviewRounds_dateTime
from applications as T1
left join interviewRounds as T2 on T1.id = T2.applicationsId
WHERE T1.userId = ? AND date(T1.applied) >= date(?)
order by
  T1.applied DESC,
  T2.dateTime DESC;
`;

  const [topCompanies, allUserApplications, totalApplications, totalCompanies] =
    await Promise.all([
      prismaClient.applications.groupBy({
        _count: { id: true },
        by: ["company"],
        orderBy: { _count: { id: "desc" } },
        take: 5,
        where: { userId },
      }),
      environment.DB.prepare(allUserApplicationsQuery)
        .bind(userId, thirtyDaysAgo)
        .all<JobApplication>()
        .then((data) => {
          return data.results;
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
