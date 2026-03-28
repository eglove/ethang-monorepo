import every from "lodash/every.js";
import filter from "lodash/filter.js";
import get from "lodash/get.js";
import { describe, expect, it } from "vitest";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

const DATE_KEY_JUNE_09 = "2024-06-09";
const DATE_KEY_JUNE_15 = "2024-06-15";
const DATE_KEY_JUNE_16 = "2024-06-16";
const DATE_KEY_JUNE_30 = "2024-06-30";
const DATE_KEY_JULY_01 = "2024-07-01";
const DATE_KEY_DEC_31 = "2024-12-31";

import {
  buildCalendarWeeks,
  buildEventsByDate,
  formatDateTime,
  formatDayHeading,
  formatTimeOnly,
  formatWeekHeading,
  getViewDateRange,
  getWeekDays,
  renderDescriptionHtml,
  shiftDate,
  toDateKey,
  toPlainText,
} from "./calendar.ts";

// ─── formatDateTime ──────────────────────────────────────────────────────────

describe(formatDateTime, () => {
  it("formats a UTC ISO string as a medium date with short time in Chicago timezone", () => {
    // 2024-06-15T18:00:00Z = 1:00 PM CDT
    const result = formatDateTime("2024-06-15T18:00:00.000Z");

    expect(result).toContain("Jun");
    expect(result).toContain("15");
    expect(result).toContain("2024");
    expect(result).toMatch(/PM/u);
  });
});

// ─── toDateKey ───────────────────────────────────────────────────────────────

describe(toDateKey, () => {
  it("zero-pads single-digit month and day", () => {
    expect(toDateKey(2024, 3, 5)).toBe("2024-03-05");
  });

  it("does not pad double-digit month and day", () => {
    expect(toDateKey(2024, 12, 31)).toBe(DATE_KEY_DEC_31);
  });

  it("handles January (month 1)", () => {
    expect(toDateKey(2024, 1, 1)).toBe("2024-01-01");
  });
});

// ─── buildEventsByDate ───────────────────────────────────────────────────────

const makeEvent = (
  id: string,
  startsAt: string,
  endsAt: string,
): CalendarEventRecord =>
  ({
    _id: id,
    endsAt,
    startsAt,
    title: id,
  }) as CalendarEventRecord;

describe(buildEventsByDate, () => {
  it("returns an empty map for no events", () => {
    expect(buildEventsByDate([])).toStrictEqual(new Map());
  });

  it("maps a single-day event to its date key", () => {
    const event = makeEvent(
      "e1",
      "2024-06-15T14:00:00Z",
      "2024-06-15T16:00:00Z",
    );
    const map = buildEventsByDate([event]);

    expect(map.get(DATE_KEY_JUNE_15)).toStrictEqual([event]);
    expect(map.size).toBe(1);
  });

  it("maps a multi-day event to every day it spans", () => {
    const event = makeEvent(
      "event1",
      "2024-06-13T14:00:00Z",
      "2024-06-15T16:00:00Z",
    );
    const map = buildEventsByDate([event]);

    expect(map.get("2024-06-13")).toStrictEqual([event]);
    expect(map.get("2024-06-14")).toStrictEqual([event]);
    expect(map.get(DATE_KEY_JUNE_15)).toStrictEqual([event]);
    expect(map.size).toBe(3);
  });

  it("stacks multiple events on the same day", () => {
    const event1 = makeEvent(
      "event1",
      "2024-06-15T09:00:00Z",
      "2024-06-15T10:00:00Z",
    );
    const event2 = makeEvent(
      "event2",
      "2024-06-15T14:00:00Z",
      "2024-06-15T15:00:00Z",
    );
    const map = buildEventsByDate([event1, event2]);

    expect(map.get(DATE_KEY_JUNE_15)).toStrictEqual([event1, event2]);
  });

  it("handles events spanning a month boundary", () => {
    const event = makeEvent(
      "e1",
      "2024-06-30T20:00:00Z",
      "2024-07-02T08:00:00Z",
    );
    const map = buildEventsByDate([event]);

    expect(map.has(DATE_KEY_JUNE_30)).toBe(true);
    expect(map.has(DATE_KEY_JULY_01)).toBe(true);
    expect(map.has("2024-07-02")).toBe(true);
  });

  it("handles events spanning a year boundary", () => {
    const event = makeEvent(
      "e1",
      "2024-12-31T20:00:00Z",
      "2025-01-01T08:00:00Z",
    );
    const map = buildEventsByDate([event]);

    expect(map.has(DATE_KEY_DEC_31)).toBe(true);
    expect(map.has("2025-01-01")).toBe(true);
  });
});

// ─── buildCalendarWeeks ──────────────────────────────────────────────────────

describe(buildCalendarWeeks, () => {
  it("returns rows where every row has exactly 7 cells", () => {
    const weeks = buildCalendarWeeks(2024, 6);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it("marks only current-month cells as current: true", () => {
    const weeks = buildCalendarWeeks(2024, 6);
    const cells = weeks.flat();
    const currentCells = filter(cells, (c) => c.current);
    const otherCells = filter(cells, (c) => !c.current);

    expect(currentCells).toHaveLength(30); // June has 30 days
    expect(every(otherCells, (c) => 6 !== c.month)).toBe(true);
  });

  it("handles a month starting on Sunday (no leading cells from prior month)", () => {
    // January 2023 starts on Sunday
    const weeks = buildCalendarWeeks(2023, 1);

    expect(weeks[0]?.[0]).toStrictEqual({
      current: true,
      day: 1,
      month: 1,
      year: 2023,
    });
  });

  it("handles February in a leap year (29 days)", () => {
    const weeks = buildCalendarWeeks(2024, 2);
    const currentCells = filter(weeks.flat(), (c) => c.current);

    expect(currentCells).toHaveLength(29);
  });

  it("handles February in a non-leap year (28 days)", () => {
    const weeks = buildCalendarWeeks(2025, 2);
    const currentCells = filter(weeks.flat(), (c) => c.current);

    expect(currentCells).toHaveLength(28);
  });

  it("wraps correctly from December to January for trailing cells", () => {
    // December 2024 ends mid-week — trailing cells should be January 2025
    const weeks = buildCalendarWeeks(2024, 12);
    const lastWeek = weeks.at(-1);
    const trailingCells = filter(lastWeek, (c) => !c.current);

    expect(trailingCells[0]?.month).toBe(1);
    expect(trailingCells[0]?.year).toBe(2025);
  });

  it("wraps correctly from January — leading cells should be December of prior year", () => {
    // January 2024 starts on Monday — leading cell is from December 2023
    const weeks = buildCalendarWeeks(2024, 1);
    const leadingCells = filter(weeks[0], (c) => !c.current);

    expect(leadingCells[0]?.month).toBe(12);
    expect(leadingCells[0]?.year).toBe(2023);
  });
});

// ─── renderDescriptionHtml ───────────────────────────────────────────────────

describe(renderDescriptionHtml, () => {
  it("returns empty string for undefined", () => {
    // @ts-expect-error for test
    expect(renderDescriptionHtml()).toBe("");
  });

  it("returns HTML for a single PortableText block", () => {
    const block = {
      _key: "b1",
      _type: "block",
      children: [{ _key: "s1", _type: "span", marks: [], text: "Hello world" }],
      markDefs: [],
      style: "normal",
    };

    const html = renderDescriptionHtml(block as never);

    expect(html).toContain("Hello world");
    expect(html).toContain("<p>");
  });

  it("returns HTML for an array of PortableText blocks", () => {
    const blocks = [
      {
        _key: "b1",
        _type: "block",
        children: [{ _key: "s1", _type: "span", marks: [], text: "First" }],
        markDefs: [],
        style: "normal",
      },
      {
        _key: "b2",
        _type: "block",
        children: [{ _key: "s2", _type: "span", marks: [], text: "Second" }],
        markDefs: [],
        style: "normal",
      },
    ];

    const html = renderDescriptionHtml(blocks as never);

    expect(html).toContain("First");
    expect(html).toContain("Second");
  });

  it("returns empty string for image blocks (images are suppressed)", () => {
    const block = { _key: "img1", _type: "image" };

    const html = renderDescriptionHtml(block as never);

    expect(html).toBe("");
  });
});

// ─── shiftDate ───────────────────────────────────────────────────────────────

describe(shiftDate, () => {
  it("shifts forward by a positive number of days", () => {
    expect(shiftDate(DATE_KEY_JUNE_15, 1)).toBe(DATE_KEY_JUNE_16);
  });

  it("shifts backward by a negative number of days", () => {
    expect(shiftDate(DATE_KEY_JUNE_15, -1)).toBe("2024-06-14");
  });

  it("wraps across a month boundary", () => {
    expect(shiftDate(DATE_KEY_JUNE_30, 1)).toBe(DATE_KEY_JULY_01);
  });

  it("wraps across a year boundary", () => {
    expect(shiftDate(DATE_KEY_DEC_31, 1)).toBe("2025-01-01");
  });
});

// ─── getWeekDays ─────────────────────────────────────────────────────────────

describe(getWeekDays, () => {
  it("returns 7 days", () => {
    expect(getWeekDays(DATE_KEY_JUNE_15)).toHaveLength(7);
  });

  it("starts on Sunday regardless of anchor day", () => {
    // 2024-06-15 is Saturday
    const days = getWeekDays(DATE_KEY_JUNE_15);

    expect(days[0]).toBe(DATE_KEY_JUNE_09); // Sunday
    expect(days[6]).toBe(DATE_KEY_JUNE_15); // Saturday
  });

  it("returns the same week when anchor is Sunday", () => {
    const days = getWeekDays(DATE_KEY_JUNE_09);

    expect(days[0]).toBe(DATE_KEY_JUNE_09);
    expect(days[6]).toBe(DATE_KEY_JUNE_15);
  });
});

// ─── formatTimeOnly ──────────────────────────────────────────────────────────

describe(formatTimeOnly, () => {
  it("formats a UTC ISO string as Chicago time", () => {
    // 18:00 UTC = 1:00 PM CDT (UTC-5)
    const result = formatTimeOnly("2024-06-15T18:00:00.000Z");

    expect(result).toMatch(/1:00\s?PM/u);
  });

  it("includes minutes", () => {
    const result = formatTimeOnly("2024-06-15T18:30:00.000Z");

    expect(result).toContain("30");
  });
});

// ─── formatDayHeading ────────────────────────────────────────────────────────

describe(formatDayHeading, () => {
  it("includes the full weekday name", () => {
    // 2024-06-15 is a Saturday
    const result = formatDayHeading(DATE_KEY_JUNE_15);

    expect(result).toContain("Saturday");
  });

  it("includes the month name", () => {
    const result = formatDayHeading(DATE_KEY_JUNE_15);

    expect(result).toContain("June");
  });

  it("includes the year", () => {
    const result = formatDayHeading(DATE_KEY_JUNE_15);

    expect(result).toContain("2024");
  });
});

// ─── formatWeekHeading ───────────────────────────────────────────────────────

describe(formatWeekHeading, () => {
  it("includes the start and end of the week", () => {
    // Week of 2024-06-09 (Sun) to 2024-06-15 (Sat)
    const result = formatWeekHeading(DATE_KEY_JUNE_15);

    expect(result).toContain("Jun");
    expect(result).toContain("9");
    expect(result).toContain("15");
  });

  it("includes the year in the end date", () => {
    const result = formatWeekHeading(DATE_KEY_JUNE_15);

    expect(result).toContain("2024");
  });

  it("contains an en-dash separator", () => {
    const result = formatWeekHeading(DATE_KEY_JUNE_15);

    expect(result).toContain("–");
  });
});

// ─── toPlainText ─────────────────────────────────────────────────────────────

describe(toPlainText, () => {
  it("returns empty string for undefined", () => {
    // @ts-expect-error for test
    expect(toPlainText()).toBe("");
  });

  it("extracts text from a single block", () => {
    const block = {
      _key: "b1",
      _type: "block",
      children: [{ _key: "s1", _type: "span", marks: [], text: "Hello" }],
      markDefs: [],
      style: "normal",
    };

    expect(toPlainText(block as never)).toBe("Hello");
  });

  it("joins multiple blocks with newlines", () => {
    const blocks = [
      {
        _key: "b1",
        _type: "block",
        children: [{ _key: "s1", _type: "span", marks: [], text: "First" }],
        markDefs: [],
        style: "normal",
      },
      {
        _key: "b2",
        _type: "block",
        children: [{ _key: "s2", _type: "span", marks: [], text: "Second" }],
        markDefs: [],
        style: "normal",
      },
    ];

    expect(toPlainText(blocks as never)).toBe("First\nSecond");
  });

  it("skips non-block types", () => {
    const block = { _key: "img1", _type: "image" };

    expect(toPlainText(block as never)).toBe("");
  });
});

// ─── getViewDateRange ─────────────────────────────────────────────────────────

describe(getViewDateRange, () => {
  it("day view: rangeStart is the date and rangeEndExclusive is the next day", () => {
    const { rangeEndExclusive, rangeStart } = getViewDateRange(
      "day",
      2024,
      6,
      DATE_KEY_JUNE_15,
    );

    expect(rangeStart).toBe(DATE_KEY_JUNE_15);
    expect(rangeEndExclusive).toBe(DATE_KEY_JUNE_16);
  });

  it("day view: wraps correctly at month boundary", () => {
    const { rangeEndExclusive, rangeStart } = getViewDateRange(
      "day",
      2024,
      6,
      DATE_KEY_JUNE_30,
    );

    expect(rangeStart).toBe(DATE_KEY_JUNE_30);
    expect(rangeEndExclusive).toBe(DATE_KEY_JULY_01);
  });

  it("week view: rangeStart is Sunday and rangeEndExclusive is the following Sunday", () => {
    // 2024-06-15 is a Saturday — week should be 2024-06-09 (Sun) to 2024-06-15 (Sat)
    const { rangeEndExclusive, rangeStart } = getViewDateRange(
      "week",
      2024,
      6,
      DATE_KEY_JUNE_15,
    );

    expect(rangeStart).toBe(DATE_KEY_JUNE_09);
    expect(rangeEndExclusive).toBe(DATE_KEY_JUNE_16);
  });

  it("week view: works when anchor is already Sunday", () => {
    // 2024-06-09 is a Sunday
    const { rangeEndExclusive, rangeStart } = getViewDateRange(
      "week",
      2024,
      6,
      DATE_KEY_JUNE_09,
    );

    expect(rangeStart).toBe(DATE_KEY_JUNE_09);
    expect(rangeEndExclusive).toBe(DATE_KEY_JUNE_16);
  });

  it("month view: rangeStart is on or before the 1st and rangeEndExclusive is after the last day", () => {
    // June 2024: starts Saturday (1st is Sat), ends Sunday (30th is Sun)
    const { rangeEndExclusive, rangeStart } = getViewDateRange(
      "month",
      2024,
      6,
      "2024-06-01",
    );

    // Grid starts on Sunday 2024-05-26 (day before June 1 which is a Saturday)
    expect(rangeStart).toBe("2024-05-26");
    // Grid ends Saturday 2024-07-06 (completing the row that starts with June 30, a Sunday)
    expect(rangeEndExclusive).toBe("2024-07-07");
  });

  it("month view: rangeStart equals the 1st when it falls on Sunday", () => {
    // September 2024: 1st is a Sunday
    const { rangeStart } = getViewDateRange("month", 2024, 9, "2024-09-01");

    expect(rangeStart).toBe("2024-09-01");
  });

  it("month view: rangeEndExclusive is the day after the last day when it falls on Saturday", () => {
    // August 2023: 31st is a Thursday — last cell is Saturday 2023-09-02
    // Actually let's use a month that ends on Saturday: March 2024 ends on Sunday
    // February 2025 ends on Friday the 28th
    // Let's use March 2025: ends on Monday the 31st
    // June 2019 ends on Sunday the 30th — trailing row ends Sat July 6, exclusive July 7
    // Use a known case: January 2022 ends on Monday 31st
    const { rangeEndExclusive } = getViewDateRange(
      "month",
      2022,
      1,
      "2022-01-01",
    );

    // Jan 31 is Monday (weekday % 7 = 1), trailing days = 7 - 1 = 6, grid ends Sat Feb 5, exclusive Feb 6
    expect(rangeEndExclusive).toBe("2022-02-06");
  });

  it("month view: covers all cells produced by buildCalendarWeeks", () => {
    const weeks = buildCalendarWeeks(2024, 6);
    const firstCell = weeks[0]?.[0];
    const lastWeek = weeks.at(-1);
    const lastCell = lastWeek?.at(-1);
    const { rangeEndExclusive, rangeStart } = getViewDateRange(
      "month",
      2024,
      6,
      "2024-06-01",
    );

    const firstCellKey = toDateKey(
      get(firstCell, ["year"]),
      get(firstCell, ["month"]),
      get(firstCell, ["day"]),
    );
    const lastCellKey = toDateKey(
      get(lastCell, ["year"]),
      get(lastCell, ["month"]),
      get(lastCell, ["day"]),
    );

    expect(Date.parse(firstCellKey)).toBeGreaterThanOrEqual(
      Date.parse(rangeStart),
    );
    expect(Date.parse(lastCellKey)).toBeLessThan(Date.parse(rangeEndExclusive));
  });
});
