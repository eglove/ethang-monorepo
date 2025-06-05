import find from "lodash/find.js";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";

import type { getUserStatsData } from "./get-user-stats-data.ts";

export const getDailyApplicationsMap = (
  allUserApplications: Awaited<
    ReturnType<typeof getUserStatsData>
  >["allUserApplications"],
) => {
  const dailyApplicationsMap: {
    date: string;
    totalApplications: number;
  }[] = [];

  for (const application of allUserApplications) {
    const appliedDate = DateTime.fromJSDate(
      new Date(application.applied),
    ).toFormat("yyyy-MM-dd");

    const current = find(dailyApplicationsMap, (item) => {
      return item.date === appliedDate;
    });

    if (isNil(current)) {
      dailyApplicationsMap.push({ date: appliedDate, totalApplications: 1 });
    } else {
      current.totalApplications += 1;
    }
  }

  return dailyApplicationsMap;
};
