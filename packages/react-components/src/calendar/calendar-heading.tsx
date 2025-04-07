import { useMemo } from "react";

import { useCalendarStore } from "./calendar-store.ts";

export const CalendarHeading = () => {
  const calendarStoreSubscription = useCalendarStore();

  const heading = useMemo(() => {
    if ("week" === calendarStoreSubscription.selectedView) {
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

    return {
      formatted: calendarStoreSubscription.selectedMonth.toLocaleString({
        month: "long",
        year: "numeric",
      }),
      time: calendarStoreSubscription.selectedMonth.toFormat("yyyy-MM"),
    };
  }, [
    calendarStoreSubscription.selectedMonth,
    calendarStoreSubscription.selectedView,
  ]);

  return (
    <h1 className="text-base font-semibold text-gray-900 text-center lg:text-left mb-2 lg:mb-0">
      <time dateTime={heading.time}>{heading.formatted}</time>
    </h1>
  );
};
