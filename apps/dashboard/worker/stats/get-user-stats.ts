import { ComputeEngine } from "@cortex-js/compute-engine";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import toNumber from "lodash/toNumber.js";

import { getAverageApplicationsPerDay } from "./utitilies/get-average-applications-per-day.ts";
import { getAverageResponseRate } from "./utitilies/get-average-response-rate.ts";
import { getAverageTimeToRejected } from "./utitilies/get-average-time-to-rejected.ts";
import { getDailyApplicationsMap } from "./utitilies/get-daily-applications-map.ts";
import { getUserStatsData } from "./utitilies/get-user-stats-data.ts";

export const statsComputeEngine = new ComputeEngine();

export const getUserStats = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  const {
    allUserApplications,
    topCompanies,
    totalApplications,
    totalCompanies,
  } = await getUserStatsData(request, environment, userId);

  const averageApplicationsPerDay =
    getAverageApplicationsPerDay(allUserApplications);
  const averageResponseRate = getAverageResponseRate(allUserApplications);
  const averageTimeToRejected = getAverageTimeToRejected(allUserApplications);
  const userDailyApplications = getDailyApplicationsMap(allUserApplications);

  return createJsonResponse(
    {
      averageApplicationsPerDay: toNumber(averageApplicationsPerDay),
      averageResponseRate: toNumber(averageResponseRate),
      averageTimeToRejected: toNumber(averageTimeToRejected),
      topCompanies,
      totalApplications: totalApplications._count._all,
      totalCompanies: totalCompanies.length,
      userDailyApplications,
    },
    "OK",
  );
};
