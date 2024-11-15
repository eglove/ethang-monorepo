import upperFirst from "lodash/upperFirst.js";
import { DateTime } from "luxon";

export const AMERICA_CHICAGO = "America/Chicago";

export const now = new Date();

export const getRelativeDate = (date: string): string => {
  return upperFirst(
    DateTime.fromISO(new Date(date).toISOString()).toRelative({
      locale: "en-US",
    }) ?? "",
  );
};
