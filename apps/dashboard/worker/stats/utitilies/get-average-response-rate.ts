import filter from "lodash/filter";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";

import type { getUserStatsData } from "./get-user-stats-data.ts";

import { statsComputeEngine } from "../get-user-stats.ts";
import { getLast30DaysOfApplications } from "./get-last-30-days-of-applications.ts";

export const getAverageResponseRate = (
  allUserApplications: Awaited<
    ReturnType<typeof getUserStatsData>
  >["allUserApplications"],
) => {
  const applications = getLast30DaysOfApplications(allUserApplications);

  const withResponses = filter(applications, (application) => {
    return (
      !isEmpty(application.interviewRounds) || !isNil(application.rejected)
    );
  });

  const result = statsComputeEngine
    .box(["Divide", withResponses.length, applications.length])
    .N();

  return true === result.isNaN ? "0" : result.toString();
};
