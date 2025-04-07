import { CalendarHeading } from "./calendar-heading.tsx";
import { CalendarScroll } from "./calendar-scroll.tsx";
import { CalendarViewSelect } from "./calendar-view-select.tsx";

export const CalendarHeader = () => {
  return (
    <header className="grid w-full place-items-center sm:flex sm:items-center sm:justify-between border-b border-gray-200 px-6 py-4">
      <CalendarHeading />
      <div className="flex items-center">
        <CalendarScroll />
        <CalendarViewSelect />
      </div>
    </header>
  );
};
