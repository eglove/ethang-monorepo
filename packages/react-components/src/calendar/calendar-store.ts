import { Store } from "@ethang/store";
import { DateTime } from "luxon";
import { useSyncExternalStore } from "react";

import type { CalendarView } from "./calendar-types.ts";

export const calendarStore = new Store({
  selectedDay: DateTime.local(),
  selectedMonth: DateTime.local(),
  selectedView: "month" as CalendarView,
  selectedWeek: DateTime.local(),
  selectedYear: DateTime.local(),
});

export const useCalendarStore = () => {
  return useSyncExternalStore(
    (listener) => calendarStore.subscribe(listener),
    () => calendarStore.get(),
    () => calendarStore.get(),
  );
};

const scrollOperations = {
  next: (unit: string, value: DateTime) => value.plus({ [unit]: 1 }),
  previous: (unit: string, value: DateTime) => value.minus({ [unit]: 1 }),
  today: (_: string, __: DateTime) => DateTime.local(),
};

const viewToStateMap = {
  day: "selectedDay",
  month: "selectedMonth",
  week: "selectedWeek",
  year: "selectedYear",
} as const;

const viewUnits = {
  day: "days",
  month: "months",
  week: "weeks",
  year: "years",
} as const;

export const handleScroll =
  (direction: "next" | "previous" | "today") => () => {
    calendarStore.set((state) => {
      const unit = viewUnits[state.selectedView];
      const stateProperty = viewToStateMap[state.selectedView];

      const updater = scrollOperations[direction];
      state[stateProperty] = updater(unit, state[stateProperty]);
    });
  };

export const handleSetView = (view: CalendarView) => () => {
  calendarStore.set((state) => {
    state.selectedView = view;
  });
};
