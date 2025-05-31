import orderBy from "lodash/orderBy";
import take from "lodash/take";

import type { getUserStatsData } from "./get-user-stats-data.ts";

export const getLast30DaysOfApplications = (
  allUserApplications: Awaited<
    ReturnType<typeof getUserStatsData>
  >["allUserApplications"],
) => {
  return take(orderBy(allUserApplications, ["applied"], "desc"), 30);
};
