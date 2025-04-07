import type { DateTime } from "luxon";

export const getCalendarDaysForMonth = (dateTime: DateTime) => {
  const startOfMonth = dateTime.startOf("month");
  const endOfMonth = dateTime.endOf("month");

  const startDay = startOfMonth.weekday % 7;
  const endDay = endOfMonth.weekday % 7;

  const daysInMonth = Array.from({ length: endOfMonth.day }, (_, index) => {
    return startOfMonth.plus({ days: index });
  });

  let daysFromPreviousMonth: DateTime[] = [];
  if (0 !== startDay) {
    const previousMonthEnd = startOfMonth.minus({ days: 1 });
    daysFromPreviousMonth = Array.from({ length: startDay }, (_, index) => {
      return previousMonthEnd.minus({ days: startDay - index - 1 });
    });
  }

  let daysFromNextMonth: DateTime[] = [];
  if (6 !== endDay) {
    const nextMonthStart = endOfMonth.plus({ days: 1 });
    daysFromNextMonth = Array.from({ length: 6 - endDay }, (_, index) => {
      return nextMonthStart.plus({ days: index });
    });
  }

  return [...daysFromPreviousMonth, ...daysInMonth, ...daysFromNextMonth];
};
