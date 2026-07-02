import { DateTime } from "effect";
import map from "lodash/map.js";
import split from "lodash/split.js";
import { describe, expect, it, vi } from "vitest";

vi.mock(import("../clients/sanity-client.ts"), () => {
  return {
    NO_DRAFTS: "!(_id in path('drafts.**'))" as const,
    sterettSanityClient: {
      fetch: vi.fn()
    } as unknown as (typeof import("../clients/sanity-client.ts"))["sterettSanityClient"]
  };
});

import { sterettSanityClient } from "../clients/sanity-client.ts";
import {
  eventRangeFormat,
  getNewsAndEvents,
  getRelativeDate
} from "./get-news-and-events.ts";

// Fixed "now" for all relative date tests: 2024-06-15 12:00:00 UTC
const NOW_MS = DateTime.toEpochMillis(
  DateTime.unsafeMake("2024-06-15T12:00:00.000Z")
);

describe(eventRangeFormat, () => {
  it("formats a same-day event with start datetime and end time only", () => {
    const result = eventRangeFormat(
      "2024-06-15T14:00:00.000Z",
      "2024-06-15T16:30:00.000Z"
    );

    expect(result).toContain("–");

    // End portion should not repeat the date
    const [, end] = split(result, " – ");

    expect(end).not.toMatch(/\d{4}/u); // no year in end portion
  });

  it("formats a multi-day event with full datetime on both ends", () => {
    const result = eventRangeFormat(
      "2024-06-15T14:00:00.000Z",
      "2024-06-16T16:00:00.000Z"
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
      "2024-06-16T04:00:00.000Z" // 11 PM Chicago Jun 15
    );

    const [, end] = split(result, " – ");

    expect(end).not.toMatch(/\d{4}/u);
  });
});

const makeIso = (epoch: number) => {
  return DateTime.formatIso(DateTime.unsafeMake(epoch));
};

describe(getRelativeDate, () => {
  it('returns "Today" for the current moment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS))).toBe("Today");

    vi.useRealTimers();
  });

  it('returns "Today" for a date within the same rounding boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS + 11 * 3_600_000))).toBe("Today");

    vi.useRealTimers();
  });

  it('returns "tomorrow" for 1 day in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS + 24 * 3_600_000))).toBe("tomorrow");

    vi.useRealTimers();
  });

  it('returns "yesterday" for 1 day in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS - 24 * 3_600_000))).toBe("yesterday");

    vi.useRealTimers();
  });

  it("returns days for 2–6 days in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS + 72 * 3_600_000))).toBe("in 3 days");

    vi.useRealTimers();
  });

  it("returns days for 2–6 days in the past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS - 72 * 3_600_000))).toBe(
      "3 days ago"
    );

    vi.useRealTimers();
  });

  it("returns weeks for 7–29 days out", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS + 168 * 3_600_000))).toBe(
      "next week"
    );
    expect(getRelativeDate(makeIso(NOW_MS + 336 * 3_600_000))).toBe(
      "in 2 weeks"
    );

    vi.useRealTimers();
  });

  it("returns weeks for 7–29 days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS - 168 * 3_600_000))).toBe(
      "last week"
    );

    vi.useRealTimers();
  });

  it("returns months for 30+ days out", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS + 720 * 3_600_000))).toBe(
      "next month"
    );
    expect(getRelativeDate(makeIso(NOW_MS + 1440 * 3_600_000))).toBe(
      "in 2 months"
    );

    vi.useRealTimers();
  });

  it("returns months for 30+ days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS - 720 * 3_600_000))).toBe(
      "last month"
    );

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
      title: "Board Meeting"
    };
    const mockUpdate = {
      _id: "upd-1",
      _updatedAt: "2024-06-14T12:00:00Z",
      date: "2024-06-14",
      description: null,
      title: "News Update"
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

  it("sorts correctly with different combinations of events and updates", async () => {
    vi.clearAllMocks();
    const mockEvent1 = {
      _id: "evt-1",
      startsAt: "2024-06-15T13:00:00Z"
    };
    const mockEvent2 = {
      _id: "evt-2",
      startsAt: "2024-06-13T10:00:00Z"
    };
    const mockUpdate1 = {
      _id: "upd-1",
      date: "2024-06-14"
    };
    const mockUpdate2 = {
      _id: "upd-2",
      date: "2024-06-16"
    };

    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce([
      mockEvent1,
      mockEvent2
    ]);
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce([
      mockUpdate1,
      mockUpdate2
    ]);

    const result = await getNewsAndEvents();

    expect(
      map(result, (r) => {
        return r._id;
      })
    ).toStrictEqual(["evt-2", "upd-1", "evt-1", "upd-2"]);
  });

  it("calls fetch twice (once for events, once for updates)", async () => {
    vi.clearAllMocks();
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue([]);

    await getNewsAndEvents();

    expect(sterettSanityClient.fetch).toHaveBeenCalledTimes(2);
  });
});
