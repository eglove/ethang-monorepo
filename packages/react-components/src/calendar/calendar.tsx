import type { CalendarEvent } from "./calendar-types.ts";

import { CalendarHeader } from "./calendar-header.tsx";
import { useCalendarStore } from "./calendar-store.ts";
import { CalendarMonthViewHeading } from "./month-view/calendar-month-view-heading.tsx";
import { CalendarMonthView } from "./month-view/calendar-month-view.tsx";
import { CalendarWeekViewHeading } from "./week-view/calendar-week-view-heading.tsx";
import { CalendarWeekView } from "./week-view/calendar-week-view.tsx";

type CalendarProperties = {
  events: CalendarEvent[];
};

export const Calendar = ({ events }: Readonly<CalendarProperties>) => {
  const calendarStoreSubscription = useCalendarStore();
  const isMonth = "month" === calendarStoreSubscription.selectedView;
  const isWeek = "week" === calendarStoreSubscription.selectedView;

  return (
    <div className="flex h-full flex-col">
      <div className="sticky z-10 top-0 bg-white">
        <CalendarHeader />
        {isMonth && <CalendarMonthViewHeading />}
        {isWeek && <CalendarWeekViewHeading />}
      </div>
      {isMonth && <CalendarMonthView events={events} />}
      {isWeek && <CalendarWeekView events={events} />}
    </div>
  );
};
