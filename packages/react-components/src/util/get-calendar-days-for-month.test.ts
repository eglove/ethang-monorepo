import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { getCalendarDaysForMonth } from "./get-calendar-days-for-month.ts";

describe("getCalendarDaysForMonth", () => {
  it("should return all days for a month including padding from the previous and next months", () => {
    const april2025 = DateTime.local(2025, 4, 1);
    const days = getCalendarDaysForMonth(april2025);

    expect(days).toHaveLength(35);
    expect(days[0]?.toISODate()).toBe("2025-03-30");
    expect(days[34]?.toISODate()).toBe("2025-05-03");
  });

  it("should return all days for a leap year February", () => {
    const february2025 = DateTime.local(2025, 2, 1);
    const days = getCalendarDaysForMonth(february2025);

    expect(days).toHaveLength(35);
    expect(days[0]?.toISODate()).toBe("2025-01-26");
    expect(days[34]?.toISODate()).toBe("2025-03-01");
  });

  it("should handle months that start on a Monday and end on a Sunday (full grid)", () => {
    const may2023 = DateTime.local(2026, 2, 1);
    const days = getCalendarDaysForMonth(may2023);

    expect(days).toHaveLength(28);
    expect(days[0]?.toISODate()).toBe("2026-02-01");
    expect(days[27]?.toISODate()).toBe("2026-02-28");
  });
});
