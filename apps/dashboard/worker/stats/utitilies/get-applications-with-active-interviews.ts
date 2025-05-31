import filter from "lodash/filter";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";

import type { getUserStatsData } from "./get-user-stats-data.ts";

import { getLast30DaysOfApplications } from "./get-last-30-days-of-applications.ts";

export const getApplicationsWithActiveInterviews = (
  allUserApplications: Awaited<
    ReturnType<typeof getUserStatsData>
  >["allUserApplications"],
) => {
  const applications = getLast30DaysOfApplications(allUserApplications);

  return filter(applications, (application) => {
    return !isEmpty(application.interviewRounds) && isNil(application.rejected);
  });
};
