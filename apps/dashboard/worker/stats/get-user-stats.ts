import { ComputeEngine } from "@cortex-js/compute-engine";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import filter from "lodash/filter.js";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString";
import set from "lodash/set";
import toNumber from "lodash/toNumber.js";
import values from "lodash/values.js";
import { DateTime } from "luxon";

import { getPrismaClient } from "../prisma-client";

const AVERAGE_APPLICATIONS_LIMIT = 30;

export const getUserStats = async (
  request: Request,
  environment: Env,
  userId: string,
  // eslint-disable-next-line sonar/cognitive-complexity,sonar/max-lines-per-function
) => {
  const prismaClient = getPrismaClient(environment);
  const computeEngine = new ComputeEngine();

  const timeZone = request.cf?.timezone;
  const thirtyDaysAgo = DateTime.now()
    .setZone(isString(timeZone) ? timeZone : "UTC")
    .minus({ day: AVERAGE_APPLICATIONS_LIMIT })
    .toJSDate();

  const [
    topCompanies,
    respondedApplicationsCount,
    allUserApplications,
    totalCompaniesAndApplications,
  ] = await Promise.all([
    prismaClient.applications.groupBy({
      _count: { id: true },
      by: ["company"],
      orderBy: { _count: { id: "desc" } },
      take: 5,
      where: { userId },
    }),
    prismaClient.applications.count({
      where: {
        OR: [{ interviewRounds: { some: {} } }, { rejected: { not: null } }],
        userId,
      },
    }),
    prismaClient.applications.findMany({
      orderBy: { applied: "asc" },
      select: {
        applied: true,
        interviewRounds: {
          orderBy: { dateTime: "asc" },
          select: { dateTime: true },
        },
        rejected: true,
      },
      where: { userId },
    }),
    prismaClient.applications.aggregate({
      _count: { _all: true, company: true },
      where: { userId },
    }),
  ]);

  const totalApplicationsCount = allUserApplications.length;
  const firstApplication =
    0 < totalApplicationsCount
      ? { applied: get(allUserApplications, [0, "applied"], null) }
      : null;

  const applicationsWithInterviews = filter(
    allUserApplications,
    (app) => 0 < app.interviewRounds.length,
  );

  const applicationsWithRejection = filter(
    allUserApplications,
    (app) => !isNil(app.rejected),
  );

  const rawApplicationsLast30Days = filter(
    allUserApplications,
    (app) => app.applied.getTime() >= thirtyDaysAgo.getTime(),
  );
  const applicationsLast30DaysCount = rawApplicationsLast30Days.length;

  const averageResponseRate =
    0 < totalApplicationsCount
      ? computeEngine
          .box(["Divide", respondedApplicationsCount, totalApplicationsCount])
          .N()
          .toString()
      : "0";

  let totalTimeDifferenceToInterview = "0";
  let applicationsCountForInterview = "0";
  for (const application of applicationsWithInterviews) {
    if (0 < application.interviewRounds.length) {
      const firstInterviewDate = get(
        application,
        ["interviewRounds", 0, "dateTime"],
        application.applied,
      );
      const applicationDate = application.applied;

      const timeDifference = computeEngine
        .box([
          "Subtract",
          firstInterviewDate.getTime(),
          applicationDate.getTime(),
        ])
        .N()
        .toString();

      totalTimeDifferenceToInterview = computeEngine
        .box(["Add", totalTimeDifferenceToInterview, timeDifference])
        .N()
        .toString();
      applicationsCountForInterview = computeEngine
        .box(["Add", applicationsCountForInterview, 1])
        .N()
        .toString();
    }
  }

  const averageTimeToInterview =
    0 < toNumber(applicationsCountForInterview)
      ? computeEngine
          .box([
            "Divide",
            totalTimeDifferenceToInterview,
            applicationsCountForInterview,
          ])
          .N()
          .toString()
      : "0";

  let totalTimeDifferenceToRejected = "0";
  let applicationsCountForRejected = "0";
  for (const application of applicationsWithRejection) {
    if (application.rejected) {
      const rejectedDate = application.rejected;
      const applicationDate = application.applied;

      const timeDifference = computeEngine
        .box(["Subtract", rejectedDate.getTime(), applicationDate.getTime()])
        .N()
        .toString();

      totalTimeDifferenceToRejected = computeEngine
        .box(["Add", totalTimeDifferenceToRejected, timeDifference])
        .N()
        .toString();

      applicationsCountForRejected = computeEngine
        .box(["Add", applicationsCountForRejected, 1])
        .N()
        .toString();
    }
  }

  const averageTimeToRejected =
    0 < toNumber(applicationsCountForRejected)
      ? computeEngine
          .box([
            "Divide",
            totalTimeDifferenceToRejected,
            applicationsCountForRejected,
          ])
          .N()
          .toString()
      : "0";

  let daysToConsiderForDailyAverage = AVERAGE_APPLICATIONS_LIMIT;
  if (!isNil(firstApplication) && !isNil(firstApplication.applied)) {
    const timeDifferenceMs =
      DateTime.now().toJSDate().getTime() - firstApplication.applied.getTime();
    const daysSinceFirstApplication = Math.ceil(
      timeDifferenceMs / (1000 * 60 * 60 * 24),
    );
    daysToConsiderForDailyAverage = Math.min(
      AVERAGE_APPLICATIONS_LIMIT,
      0 < daysSinceFirstApplication ? daysSinceFirstApplication : 1,
    );
  }
  if (0 === applicationsLast30DaysCount) {
    daysToConsiderForDailyAverage = 1;
  }

  const averageApplicationsPerDay =
    0 < applicationsLast30DaysCount
      ? computeEngine
          .box([
            "Divide",
            applicationsLast30DaysCount,
            daysToConsiderForDailyAverage,
          ])
          .N()
          .toString()
      : "0";

  const userDailyApplicationsMap: Record<
    string,
    { date: string; totalApplications: number }
  > = {};
  for (const app of rawApplicationsLast30Days) {
    const dateKey = DateTime.fromJSDate(app.applied).toFormat("yyyy-MM-dd");

    if (isNil(userDailyApplicationsMap[dateKey])) {
      userDailyApplicationsMap[dateKey] = {
        date: dateKey,
        totalApplications: 0,
      };
    }

    const currentValue = get(
      userDailyApplicationsMap,
      [dateKey, "totalApplications"],
      0,
    );
    set(
      userDailyApplicationsMap,
      [dateKey, "totalApplications"],
      currentValue + 1,
    );
  }

  const userDailyApplications = values(userDailyApplicationsMap).sort(
    (a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    },
  );

  const totalCompanies = totalCompaniesAndApplications._count.company;
  const totalApplications = totalCompaniesAndApplications._count._all;

  return createJsonResponse(
    {
      averageApplicationsPerDay: toNumber(averageApplicationsPerDay),
      averageResponseRate: toNumber(averageResponseRate),
      averageTimeToInterview: toNumber(averageTimeToInterview),
      averageTimeToRejected: toNumber(averageTimeToRejected),
      topCompanies,
      totalApplications,
      totalCompanies,
      userDailyApplications,
    },
    "OK",
  );
};
