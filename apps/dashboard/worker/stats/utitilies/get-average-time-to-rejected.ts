import filter from "lodash/filter.js";
import isNil from "lodash/isNil";
import { DateTime } from "luxon";

import type { getUserStatsData } from "./get-user-stats-data.ts";

import { statsComputeEngine } from "../get-user-stats.ts";
import { getLast30DaysOfApplications } from "./get-last-30-days-of-applications.ts";

export const getAverageTimeToRejected = (
  allUserApplications: Awaited<
    ReturnType<typeof getUserStatsData>
  >["allUserApplications"],
) => {
  const applications = getLast30DaysOfApplications(allUserApplications);

  const withRejects = filter(applications, (application) => {
    return !isNil(application.rejected);
  });

  let daySum = 0;
  for (const application of withRejects) {
    if (!isNil(application.rejected)) {
      daySum += DateTime.fromJSDate(application.rejected).diff(
        DateTime.fromJSDate(application.applied),
        "days",
      ).days;
    }
  }

  const result = statsComputeEngine
    .box(["Divide", daySum, withRejects.length])
    .N();

  return true === result.isNaN ? "0" : result.toString();
};
