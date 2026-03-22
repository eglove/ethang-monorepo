import split from "lodash/split.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { eventRangeFormat, getRelativeDate } from "./get-news-and-events.ts";

// Fixed "now" for all relative date tests: 2024-06-15 12:00:00 UTC
const NOW = new Date("2024-06-15T12:00:00.000Z");

describe("eventRangeFormat", () => {
  it("formats a same-day event with start datetime and end time only", () => {
    const result = eventRangeFormat(
      "2024-06-15T14:00:00.000Z",
      "2024-06-15T16:30:00.000Z",
    );

    expect(result).toContain("–");
    // End portion should not repeat the date
    const [, end] = split(result, " – ");
    expect(end).not.toMatch(/\d{4}/u); // no year in end portion
  });

  it("formats a multi-day event with full datetime on both ends", () => {
    const result = eventRangeFormat(
      "2024-06-15T14:00:00.000Z",
      "2024-06-16T16:00:00.000Z",
    );

    expect(result).toContain("–");
    const [start, end] = split(result, " – ");
    expect(start).toMatch(/\d{4}/u); // year in start
    expect(end).toMatch(/\d{4}/u); // year in end
  });

  it("treats events crossing midnight UTC but same day in Chicago as same-day", () => {
    // 11 PM Chicago = 4 AM UTC next day — this start/end pair is same Chicago day
    const result = eventRangeFormat(
      "2024-06-16T02:00:00.000Z", // 9 PM Chicago Jun 15
      "2024-06-16T04:00:00.000Z", // 11 PM Chicago Jun 15
    );

    const [, end] = split(result, " – ");
    expect(end).not.toMatch(/\d{4}/u);
  });
});

describe("getRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for the current moment', () => {
    expect(getRelativeDate(NOW.toISOString())).toBe("Today");
  });

  it('returns "Today" for a date within the same rounding boundary', () => {
    const almostTomorrow = new Date(NOW.getTime() + 1000 * 60 * 60 * 11); // +11h
    expect(getRelativeDate(almostTomorrow.toISOString())).toBe("Today");
  });

  it('returns "tomorrow" for 1 day in the future', () => {
    const tomorrow = new Date(NOW.getTime() + 1000 * 60 * 60 * 24);
    expect(getRelativeDate(tomorrow.toISOString())).toBe("tomorrow");
  });

  it('returns "yesterday" for 1 day in the past', () => {
    const yesterday = new Date(NOW.getTime() - 1000 * 60 * 60 * 24);
    expect(getRelativeDate(yesterday.toISOString())).toBe("yesterday");
  });

  it("returns days for 2–6 days in the future", () => {
    const in3Days = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 3);
    expect(getRelativeDate(in3Days.toISOString())).toBe("in 3 days");
  });

  it("returns days for 2–6 days in the past", () => {
    const ago3Days = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 3);
    expect(getRelativeDate(ago3Days.toISOString())).toBe("3 days ago");
  });

  it("returns weeks for 7–29 days out", () => {
    const in1Week = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 7);
    expect(getRelativeDate(in1Week.toISOString())).toBe("next week");

    const in2Weeks = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 14);
    expect(getRelativeDate(in2Weeks.toISOString())).toBe("in 2 weeks");
  });

  it("returns weeks for 7–29 days ago", () => {
    const ago1Week = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 7);
    expect(getRelativeDate(ago1Week.toISOString())).toBe("last week");
  });

  it("returns months for 30+ days out", () => {
    const in1Month = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 30);
    expect(getRelativeDate(in1Month.toISOString())).toBe("next month");

    const in2Months = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 60);
    expect(getRelativeDate(in2Months.toISOString())).toBe("in 2 months");
  });

  it("returns months for 30+ days ago", () => {
    const ago1Month = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 30);
    expect(getRelativeDate(ago1Month.toISOString())).toBe("last month");
  });
});
