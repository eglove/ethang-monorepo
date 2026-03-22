import every from "lodash/every.js";
import filter from "lodash/filter.js";
import { describe, expect, it } from "vitest";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

const DATE_KEY_JUNE_15 = "2024-06-15";

import {
  buildCalendarWeeks,
  buildEventsByDate,
  renderDescriptionHtml,
  toDateKey,
} from "./calendar.ts";

// ─── toDateKey ───────────────────────────────────────────────────────────────

describe("toDateKey", () => {
  it("zero-pads single-digit month and day", () => {
    expect(toDateKey(2024, 3, 5)).toBe("2024-03-05");
  });

  it("does not pad double-digit month and day", () => {
    expect(toDateKey(2024, 12, 31)).toBe("2024-12-31");
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
): CalendarEventRecord => ({ _id: id, endsAt, startsAt, title: id });

describe("buildEventsByDate", () => {
  it("returns an empty map for no events", () => {
    expect(buildEventsByDate([])).toEqual(new Map());
  });

  it("maps a single-day event to its date key", () => {
    const event = makeEvent(
      "e1",
      "2024-06-15T14:00:00Z",
      "2024-06-15T16:00:00Z",
    );
    const map = buildEventsByDate([event]);

    expect(map.get(DATE_KEY_JUNE_15)).toEqual([event]);
    expect(map.size).toBe(1);
  });

  it("maps a multi-day event to every day it spans", () => {
    const event = makeEvent(
      "event1",
      "2024-06-13T14:00:00Z",
      "2024-06-15T16:00:00Z",
    );
    const map = buildEventsByDate([event]);

    expect(map.get("2024-06-13")).toEqual([event]);
    expect(map.get("2024-06-14")).toEqual([event]);
    expect(map.get(DATE_KEY_JUNE_15)).toEqual([event]);
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

    expect(map.get(DATE_KEY_JUNE_15)).toEqual([event1, event2]);
  });

  it("handles events spanning a month boundary", () => {
    const event = makeEvent(
      "e1",
      "2024-06-30T20:00:00Z",
      "2024-07-02T08:00:00Z",
    );
    const map = buildEventsByDate([event]);

    expect(map.has("2024-06-30")).toBe(true);
    expect(map.has("2024-07-01")).toBe(true);
    expect(map.has("2024-07-02")).toBe(true);
  });

  it("handles events spanning a year boundary", () => {
    const event = makeEvent(
      "e1",
      "2024-12-31T20:00:00Z",
      "2025-01-01T08:00:00Z",
    );
    const map = buildEventsByDate([event]);

    expect(map.has("2024-12-31")).toBe(true);
    expect(map.has("2025-01-01")).toBe(true);
  });
});

// ─── buildCalendarWeeks ──────────────────────────────────────────────────────

describe("buildCalendarWeeks", () => {
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
    expect(weeks[0]?.[0]).toEqual({
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

    if (0 < trailingCells.length) {
      expect(trailingCells[0]?.month).toBe(1);
      expect(trailingCells[0]?.year).toBe(2025);
    }
  });

  it("wraps correctly from January — leading cells should be December of prior year", () => {
    // January 2024 starts on Monday — leading cell is from December 2023
    const weeks = buildCalendarWeeks(2024, 1);
    const leadingCells = filter(weeks[0], (c) => !c.current);

    if (0 < leadingCells.length) {
      expect(leadingCells[0]?.month).toBe(12);
      expect(leadingCells[0]?.year).toBe(2023);
    }
  });
});

// ─── renderDescriptionHtml ───────────────────────────────────────────────────

describe("renderDescriptionHtml", () => {
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const html = renderDescriptionHtml(blocks as never);
    expect(html).toContain("First");
    expect(html).toContain("Second");
  });

  it("returns empty string for image blocks (images are suppressed)", () => {
    const block = { _key: "img1", _type: "image" };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const html = renderDescriptionHtml(block as never);
    expect(html).toBe("");
  });
});
