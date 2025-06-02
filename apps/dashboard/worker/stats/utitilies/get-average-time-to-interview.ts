import filter from "lodash/filter";
import head from "lodash/head";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil.js";
import sortBy from "lodash/sortBy";
import { DateTime } from "luxon";

import type { getUserStatsData } from "./get-user-stats-data.ts";

import { statsComputeEngine } from "../get-user-stats.ts";

export const getAverageTimeToInterview = (
  allUserApplications: Awaited<
    ReturnType<typeof getUserStatsData>
  >["allUserApplications"],
) => {
  const withInterviews = filter(allUserApplications, (application) => {
    return !isEmpty(application.interviewRounds);
  });

  let daySum = 0;
  for (const application of withInterviews) {
    const firstInterviewRound = head(
      sortBy(application.interviewRounds, ["dateTime"]),
    );

    if (!isNil(firstInterviewRound)) {
      daySum += DateTime.fromJSDate(firstInterviewRound.dateTime).diff(
        DateTime.fromJSDate(application.applied),
        "days",
      ).days;
    }
  }

  const result = statsComputeEngine
    .box(["Divide", daySum, withInterviews.length])
    .N();

  return true === result.isNaN ? "0" : result.toString();
};
