import { DateTime } from "luxon";

import { AMERICA_CHICAGO } from "./date.ts";

export const eventRangeFormat = (start: string, end: string) => {
  const startDate = DateTime.fromISO(start, {
    zone: AMERICA_CHICAGO,
  });
  const endDate = DateTime.fromISO(end, {
    zone: AMERICA_CHICAGO,
  });

  if (1 > startDate.diff(endDate).days) {
    return `${startDate.toLocaleString({
      dateStyle: "medium",
      timeStyle: "short",
    })} - ${endDate.toLocaleString({ timeStyle: "short" })}`;
  }

  return `${startDate.toLocaleString({
    dateStyle: "medium",
    timeStyle: "short",
  })} - ${endDate.toLocaleString({
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
};
