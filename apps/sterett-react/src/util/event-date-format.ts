import { DateTime } from "luxon";

import { AMERICA_CHICAGO } from "./date.ts";

export const eventDateFormat = (date: string): string => {
  return DateTime.fromISO(date, { zone: AMERICA_CHICAGO }).toLocaleString({
    dateStyle: "medium",
    timeStyle: "short",
  });
};
