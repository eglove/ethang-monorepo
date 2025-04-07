import { Store } from "@ethang/store";
import { DateTime } from "luxon";
import { useSyncExternalStore } from "react";

import type { CalendarView } from "./calendar-types.ts";

export const calendarStore = new Store({
  selectedMonth: DateTime.local(),
  selectedView: "month" as CalendarView,
  selectedWeek: DateTime.local(),
});

export const useCalendarStore = () => {
  return useSyncExternalStore(
    (listener) => calendarStore.subscribe(listener),
    () => calendarStore.get(),
    () => calendarStore.get(),
  );
};

export const handleScroll =
  (direction: "next" | "previous" | "today") => () => {
    calendarStore.set((state) => {
      switch (direction) {
        case "next": {
          if ("week" === state.selectedView) {
            state.selectedWeek = state.selectedWeek.plus({ weeks: 1 });
          } else {
            state.selectedMonth = state.selectedMonth.plus({ months: 1 });
          }
          break;
        }

        case "previous": {
          if ("week" === state.selectedView) {
            state.selectedWeek = state.selectedWeek.minus({ weeks: 1 });
          } else {
            state.selectedMonth = state.selectedMonth.minus({ months: 1 });
          }
          break;
        }

        case "today": {
          if ("week" === state.selectedView) {
            state.selectedWeek = DateTime.local();
          } else {
            state.selectedMonth = DateTime.local();
          }
          break;
        }
      }
    });
  };

export const handleSetView = (view: CalendarView) => () => {
  calendarStore.set((state) => {
    state.selectedView = view;
  });
};
