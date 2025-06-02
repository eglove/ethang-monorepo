import filter from "lodash/filter";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";

import type { getUserStatsData } from "./get-user-stats-data.ts";

import { statsComputeEngine } from "../get-user-stats.ts";

export const getAverageResponseRate = (
  allUserApplications: Awaited<
    ReturnType<typeof getUserStatsData>
  >["allUserApplications"],
) => {
  const withResponses = filter(allUserApplications, (application) => {
    return (
      !isEmpty(application.interviewRounds) || !isNil(application.rejected)
    );
  });

  const result = statsComputeEngine
    .box(["Divide", withResponses.length, allUserApplications.length])
    .N();

  return true === result.isNaN ? "0" : result.toString();
};
