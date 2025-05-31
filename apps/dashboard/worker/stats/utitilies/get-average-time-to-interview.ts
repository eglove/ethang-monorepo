import head from "lodash/head";
import isNil from "lodash/isNil.js";
import sortBy from "lodash/sortBy";
import { DateTime } from "luxon";

import type { getUserStatsData } from "./get-user-stats-data.ts";

import { statsComputeEngine } from "../get-user-stats.ts";
import { getApplicationsWithActiveInterviews } from "./get-applications-with-active-interviews.ts";

export const getAverageTimeToInterview = (
  allUserApplications: Awaited<
    ReturnType<typeof getUserStatsData>
  >["allUserApplications"],
) => {
  const applicationsWithActiveInterviews =
    getApplicationsWithActiveInterviews(allUserApplications);

  let daySum = 0;
  for (const application of applicationsWithActiveInterviews) {
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
    .box(["Divide", daySum, applicationsWithActiveInterviews.length])
    .N();

  return true === result.isNaN ? "0" : result.toString();
};
