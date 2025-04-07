import { useMemo } from "react";

import { useCalendarStore } from "./calendar-store.ts";

export const CalendarHeading = () => {
  const calendarStoreSubscription = useCalendarStore();

  const heading = useMemo(() => {
    switch (calendarStoreSubscription.selectedView) {
      case "day": {
        return {
          formatted: calendarStoreSubscription.selectedDay.toLocaleString({
            dateStyle: "medium",
          }),
          time: calendarStoreSubscription.selectedDay.toISODate(),
        };
      }

      case "month": {
        return {
          formatted: calendarStoreSubscription.selectedMonth.toLocaleString({
            month: "long",
            year: "numeric",
          }),
          time: calendarStoreSubscription.selectedMonth.toFormat("yyyy-MM"),
        };
      }

      case "week": {
        return {
          formatted: `${calendarStoreSubscription.selectedWeek
            .startOf("week", { useLocaleWeeks: true })
            .toLocaleString({
              dateStyle: "medium",
            })} - ${calendarStoreSubscription.selectedWeek.endOf("week", { useLocaleWeeks: true }).toLocaleString({ dateStyle: "medium" })}`,
          time: `${calendarStoreSubscription.selectedWeek
            .startOf("week", { useLocaleWeeks: true })
            .toISODate()}/${calendarStoreSubscription.selectedWeek.endOf("week", { useLocaleWeeks: true }).toISODate()}`,
        };
      }

      case "year": {
        return {
          formatted: calendarStoreSubscription.selectedYear.toLocaleString({
            year: "numeric",
          }),
          time: calendarStoreSubscription.selectedYear.toFormat("yyyy"),
        };
      }
    }
  }, [
    calendarStoreSubscription.selectedDay,
    calendarStoreSubscription.selectedMonth,
    calendarStoreSubscription.selectedView,
    calendarStoreSubscription.selectedWeek,
    calendarStoreSubscription.selectedYear,
  ]);

  return (
    <h1 className="text-base font-semibold text-gray-900 text-center lg:text-left mb-2 lg:mb-0">
      <time dateTime={heading.time}>{heading.formatted}</time>
    </h1>
  );
};
