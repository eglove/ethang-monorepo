import type { DateTime } from "luxon";

export const getCalendarDaysForWeek = (dateTime: DateTime) => {
  const startOfWeek = dateTime.startOf("week", { useLocaleWeeks: true });

  return Array.from({ length: 7 }, (_, index) => {
    return startOfWeek.plus({ days: index });
  });
};
