import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { getCalendarDaysForWeek } from "./get-calendar-days-for-week.ts";

describe("getCalendarDaysForWeek", () => {
  it("should return all days of the week for a given date", () => {
    const date = DateTime.fromISO("2025-04-07");
    const weekDays = getCalendarDaysForWeek(date);

    expect(weekDays).toHaveLength(7);
    expect(weekDays[0]?.toISODate()).toBe("2025-04-06");
    expect(weekDays[6]?.toISODate()).toBe("2025-04-12");
  });

  it("should handle year boundary correctly", () => {
    const date = DateTime.fromISO("2023-12-31"); // Sunday, December 31st, 2023
    const weekDays = getCalendarDaysForWeek(date);

    expect(weekDays).toHaveLength(7);
    expect(weekDays[0]?.toISODate()).toBe("2023-12-31");
    expect(weekDays[6]?.toISODate()).toBe("2024-01-06");
  });

  it("should handle leap years", () => {
    const date = DateTime.fromISO("2024-02-28"); // Wednesday, February 28th, 2024 (leap year)
    const weekDays = getCalendarDaysForWeek(date);

    expect(weekDays).toHaveLength(7);
    expect(weekDays[0]?.toISODate()).toBe("2024-02-25");
    expect(weekDays[6]?.toISODate()).toBe("2024-03-02");
  });

  it("should handle week starting and ending within the same month", () => {
    const date = DateTime.fromISO("2023-10-04"); // Wednesday, October 4th, 2023
    const weekDays = getCalendarDaysForWeek(date);

    expect(weekDays).toHaveLength(7);
    expect(weekDays[0]?.toISODate()).toBe("2023-10-01");
    expect(weekDays[6]?.toISODate()).toBe("2023-10-07");
  });

  it("should start with Sunday", () => {
    const currentDate = DateTime.now();
    const weekDays = getCalendarDaysForWeek(currentDate);

    expect(weekDays).toHaveLength(7);
    expect(weekDays[0]?.weekdayShort).toBe("Sun"); // Week starts on Sunday
  });
});
