/* eslint-disable @typescript-eslint/unbound-method */
import split from "lodash/split.js";
import { describe, expect, it, vi } from "vitest";

vi.mock(import("../clients/sanity-client.ts"), () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))" as const,
  sterettSanityClient: {
    fetch: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  } as unknown as (typeof import("../clients/sanity-client.ts"))["sterettSanityClient"],
}));

import { sterettSanityClient } from "../clients/sanity-client.ts";
import {
  eventRangeFormat,
  getNewsAndEvents,
  getRelativeDate,
} from "./get-news-and-events.ts";

// Fixed "now" for all relative date tests: 2024-06-15 12:00:00 UTC
const NOW = new Date("2024-06-15T12:00:00.000Z");

describe(eventRangeFormat, () => {
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

describe(getRelativeDate, () => {
  it('returns "Today" for the current moment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    expect(getRelativeDate(NOW.toISOString())).toBe("Today");

    vi.useRealTimers();
  });

  it('returns "Today" for a date within the same rounding boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const almostTomorrow = new Date(NOW.getTime() + 1000 * 60 * 60 * 11); // +11h

    expect(getRelativeDate(almostTomorrow.toISOString())).toBe("Today");

    vi.useRealTimers();
  });

  it('returns "tomorrow" for 1 day in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const tomorrow = new Date(NOW.getTime() + 1000 * 60 * 60 * 24);

    expect(getRelativeDate(tomorrow.toISOString())).toBe("tomorrow");

    vi.useRealTimers();
  });

  it('returns "yesterday" for 1 day in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const yesterday = new Date(NOW.getTime() - 1000 * 60 * 60 * 24);

    expect(getRelativeDate(yesterday.toISOString())).toBe("yesterday");

    vi.useRealTimers();
  });

  it("returns days for 2–6 days in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const in3Days = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 3);

    expect(getRelativeDate(in3Days.toISOString())).toBe("in 3 days");

    vi.useRealTimers();
  });

  it("returns days for 2–6 days in the past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const ago3Days = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 3);

    expect(getRelativeDate(ago3Days.toISOString())).toBe("3 days ago");

    vi.useRealTimers();
  });

  it("returns weeks for 7–29 days out", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const in1Week = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 7);

    expect(getRelativeDate(in1Week.toISOString())).toBe("next week");

    const in2Weeks = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 14);

    expect(getRelativeDate(in2Weeks.toISOString())).toBe("in 2 weeks");

    vi.useRealTimers();
  });

  it("returns weeks for 7–29 days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const ago1Week = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 7);

    expect(getRelativeDate(ago1Week.toISOString())).toBe("last week");

    vi.useRealTimers();
  });

  it("returns months for 30+ days out", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const in1Month = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 30);

    expect(getRelativeDate(in1Month.toISOString())).toBe("next month");

    const in2Months = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 60);

    expect(getRelativeDate(in2Months.toISOString())).toBe("in 2 months");

    vi.useRealTimers();
  });

  it("returns months for 30+ days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const ago1Month = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 30);

    expect(getRelativeDate(ago1Month.toISOString())).toBe("last month");

    vi.useRealTimers();
  });
});

describe(getNewsAndEvents, () => {
  it("returns an empty array when there are no events or updates", async () => {
    vi.clearAllMocks();
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce([]);
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce([]);

    const result = await getNewsAndEvents();

    expect(result).toStrictEqual([]);
  });

  it("merges events and updates sorted by date ascending", async () => {
    vi.clearAllMocks();
    const mockEvent = {
      _id: "evt-1",
      _updatedAt: "2024-06-15T12:00:00Z",
      description: null,
      endsAt: "2024-06-15T15:00:00Z",
      startsAt: "2024-06-15T13:00:00Z",
      title: "Board Meeting",
    };
    const mockUpdate = {
      _id: "upd-1",
      _updatedAt: "2024-06-14T12:00:00Z",
      date: "2024-06-14",
      description: null,
      title: "News Update",
    };

    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce([mockEvent]);
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce([mockUpdate]);

    const result = await getNewsAndEvents();

    expect(result).toHaveLength(2);
    expect(result[0]?._id).toBe("upd-1"); // Jun 14 sorts before Jun 15
    expect(result[1]?._id).toBe("evt-1");
  });

  it("calls fetch twice (once for events, once for updates)", async () => {
    vi.clearAllMocks();
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue([]);

    await getNewsAndEvents();

    expect(sterettSanityClient.fetch).toHaveBeenCalledTimes(2);
  });
});
