import get from "lodash/get";
import set from "lodash/set";
import size from "lodash/size";
import { DateTime } from "luxon";

import type { getUserStatsData } from "./get-user-stats-data.ts";

import { statsComputeEngine } from "../get-user-stats";
import { getLast30DaysOfApplications } from "./get-last-30-days-of-applications.ts";

export const getAverageApplicationsPerDay = (
  allUserApplications: Awaited<
    ReturnType<typeof getUserStatsData>
  >["allUserApplications"],
) => {
  const applications = getLast30DaysOfApplications(allUserApplications);

  const dates: Record<string, number> = {};
  let total = 0;
  for (const application of applications) {
    const day = DateTime.fromJSDate(application.applied).toFormat("yyyy-MM-dd");
    const current = get(dates, day, 0);

    set(dates, day, current + 1);
    total += 1;
  }

  const result = statsComputeEngine.box(["Divide", total, size(dates)]).N();

  return true === result.isNaN ? "0" : result.toString();
};
