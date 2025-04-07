import type { CalendarEvent } from "./calendar-types.ts";

import { CalendarHeader } from "./calendar-header.tsx";
import { useCalendarStore } from "./calendar-store.ts";
import { CalendarMonthView } from "./month-view/calendar-month-view.tsx";
import { CalendarWeekView } from "./week-view/calendar-week-view.tsx";

type CalendarProperties = {
  events: CalendarEvent[];
};

export const Calendar = ({ events }: Readonly<CalendarProperties>) => {
  const calendarStoreSubscription = useCalendarStore();

  return (
    <div className="flex h-full flex-col">
      <CalendarHeader />
      {"month" === calendarStoreSubscription.selectedView && (
        <CalendarMonthView events={events} />
      )}
      {"week" === calendarStoreSubscription.selectedView && (
        <CalendarWeekView events={events} />
      )}
    </div>
  );
};
