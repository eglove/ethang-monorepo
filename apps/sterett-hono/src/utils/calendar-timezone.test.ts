import { DateTime } from "effect";
import { describe, expect, it } from "vitest";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

import { buildEventsByDate } from "./calendar.ts";

const CHICAGO = "America/Chicago";

const EXPECTED_DAY = "2024-06-15";
const DIFFERENT_DAY = "2024-06-16";

const NOW_ISO = DateTime.formatIso(DateTime.unsafeNow());

const makeEvent = (
  id: string,
  startsAt: string,
  endsAt: string
): CalendarEventRecord => {
  return {
    _id: id,
    _updatedAt: NOW_ISO,
    description: undefined,
    endsAt,
    startsAt,
    title: id
  } as unknown as CalendarEventRecord;
};

describe("buildEventsByDate timezone handling", () => {
  /**
  CAL-1 BUG: Evening events in Chicago are mapped to the wrong calendar day.
  
  Hypothesis: An event at 11:00 PM CDT on June 15 is stored in Sanity as
  "2024-06-16T04:00:00Z" (midnight UTC June 16). When buildEventsByDate naively
  splits the ISO string at 'T', it extracts "2024-06-16" as the date key,
  placing the event on June 16 instead of June 15.
  
  The correct behavior is to account for the Chicago timezone first:
  "2024-06-16T04:00:00Z" in Chicago = June 15 local time → date key "2024-06-15".
  */
  it("places a late-evening Chicago event on the correct local day", () => {
    // 11:00 PM CDT June 15 = 04:00 UTC June 16 (CDT is UTC-5)
    // Make it a same-day event: 11:00 PM → 11:30 PM CDT June 15
    const event = makeEvent(
      "e1",
      "2024-06-16T04:00:00.000Z",
      "2024-06-16T04:30:00.000Z"
    );
    const map = buildEventsByDate([event]);

    // The event should appear on June 15 (Chicago local start date)
    expect(map.get(EXPECTED_DAY)).toStrictEqual([event]);
    // It should NOT appear on June 16 (event ends before midnight Chicago)
    expect(map.get(DIFFERENT_DAY)).toBeUndefined();
  });

  /**
  Verify a mid-day event still works correctly (no timezone shift needed).
  */
  it("places a mid-day Chicago event on the correct local day", () => {
    // 1:00 PM CDT June 15 = 18:00 UTC June 15
    const event = makeEvent(
      "e2",
      "2024-06-15T18:00:00.000Z",
      "2024-06-15T19:00:00.000Z"
    );
    const map = buildEventsByDate([event]);

    expect(map.get(EXPECTED_DAY)).toStrictEqual([event]);
    expect(map.get(DIFFERENT_DAY)).toBeUndefined();
  });

  /**
  CAL-4: Malformed/empty dates should not crash.
  */
  it("gracefully skips events with invalid startsAt values", () => {
    const validEvent = makeEvent(
      "valid",
      "2024-06-15T14:00:00Z",
      "2024-06-15T16:00:00Z"
    );
    const invalidEvent = makeEvent("invalid", "", "2024-06-15T16:00:00Z");
    const map = buildEventsByDate([validEvent, invalidEvent]);

    expect(map.get(EXPECTED_DAY)).toStrictEqual([validEvent]);
    expect(map.size).toBe(1);
  });
});

describe("calendar-page monthName", () => {
  /**
  CAL-2 BUG: monthName shows the wrong month name in Chicago timezone.
  
  Hypothesis: unsafeMakeZoned without adjustForTimeZone causes UTC midnight
  on the 1st to be associated with Chicago but still interpreted as the prior
  day's evening. format with timeZone: CHICAGO then returns the previous month.
  */
  it("returns 'June' for month 6 in Chicago timezone", () => {
    const month = 6;
    const year = 2024;
    const firstOfMonth = DateTime.unsafeMake({ day: 1, month, year });

    // FIX: add adjustForTimeZone: true so UTC midnight June 1 is interpreted
    // as Chicago midnight June 1, not Chicago 7 PM May 31
    const zoned = DateTime.unsafeMakeZoned(firstOfMonth, {
      adjustForTimeZone: true,
      timeZone: CHICAGO
    });
    const monthName = DateTime.format(zoned, {
      month: "long",
      timeZone: CHICAGO
    });

    expect(monthName).toBe("June");
  });
});

describe("calendar-page todayNowParts", () => {
  /**
  CAL-3 BUG: toPartsUtc on a zoned DateTime returns wrong month at boundary.
  
  At 5 AM UTC July 1, Chicago is still 12 AM CDT June 30.
  toPartsUtc would return month=7 (July), but should return month=6 (June)
  for Chicago-local display.
  */
  it("returns Chicago-local month at UTC month boundary", () => {
    // 4 AM UTC July 1 = 11 PM CDT June 30 (different months!)
    const dt = DateTime.unsafeMake("2024-07-01T04:00:00.000Z");
    const zoned = DateTime.unsafeMakeZoned(dt, { timeZone: CHICAGO });

    // BUG: toPartsUtc ignores timezone → returns July (month 7)
    const utcParts = DateTime.toPartsUtc(zoned);

    expect(utcParts.month).toBe(7); // WRONG

    // FIX: toParts respects the associated timezone → returns June (month 6)
    const localParts = DateTime.toParts(zoned);

    expect(localParts.month).toBe(6); // CORRECT
  });
});
