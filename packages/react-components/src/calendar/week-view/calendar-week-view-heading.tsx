import first from "lodash/first.js";
import map from "lodash/map.js";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";

import { getCalendarDaysForWeek } from "../../util/get-calendar-days-for-week.ts";
import { useCalendarStore } from "../calendar-store.ts";

export const CalendarWeekViewHeading = () => {
  const calendarStoreSubscription = useCalendarStore();
  const now = DateTime.local();
  const daysForWeek = getCalendarDaysForWeek(
    calendarStoreSubscription.selectedWeek,
  );

  return (
    <div className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5 sm:pr-8">
      <div className="grid grid-cols-7 text-sm/6 text-gray-500 sm:hidden">
        {map(daysForWeek, (day) => {
          const isToday = day.toISODate() === now.toISODate();

          return (
            <div
              className="flex flex-col items-center pb-3 pt-2"
              key={day.toISODate()}
            >
              {first(day.weekdayShort)}{" "}
              <span
                className={twMerge(
                  "mt-1 flex size-8 items-center justify-center font-semibold",
                  !isToday && "text-gray-900",
                  isToday && "bg-primary text-primary-foreground rounded-full",
                )}
              >
                {day.day}
              </span>
            </div>
          );
        })}
      </div>

      <div className="-mr-px hidden grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500 sm:grid">
        <div className="col-end-1 w-14" />
        {map(daysForWeek, (day) => {
          const isToday = day.toISODate() === now.toISODate();

          return (
            <div
              className="flex items-center justify-center py-3"
              key={day.toISODate()}
            >
              <span className={twMerge(isToday && "flex items-baseline")}>
                {day.weekdayShort}{" "}
                <span
                  className={twMerge(
                    "items-center justify-center font-semibold",
                    !isToday && "text-gray-900",
                    isToday &&
                      "ml-1.5 flex size-8 rounded-full bg-primary text-primary-foreground",
                  )}
                >
                  {day.day}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
