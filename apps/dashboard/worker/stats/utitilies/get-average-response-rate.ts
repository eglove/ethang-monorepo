import type { getUserStatsData } from "./get-user-stats-data.ts";

import { statsComputeEngine } from "../get-user-stats.ts";
import { getApplicationsWithActiveInterviews } from "./get-applications-with-active-interviews.ts";

export const getAverageResponseRate = (
  allUserApplications: Awaited<
    ReturnType<typeof getUserStatsData>
  >["allUserApplications"],
) => {
  const applications = getApplicationsWithActiveInterviews(allUserApplications);

  const result = statsComputeEngine
    .box(["Divide", applications.length, allUserApplications.length])
    .N();

  return true === result.isNaN ? "0" : result.toString();
};
