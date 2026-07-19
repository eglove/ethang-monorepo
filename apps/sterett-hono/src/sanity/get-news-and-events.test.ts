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
  it.each([
    {
      assertion:
        "does not repeat the year in the end portion for same-day events",
      endsAt: "2024-06-15T16:30:00.000Z",
      startsAt: "2024-06-15T14:00:00.000Z",
      yearInEnd: false,
      yearInStart: false
    },
    {
      assertion: "includes the year on both ends for multi-day events",
      endsAt: "2024-06-16T16:00:00.000Z",
      startsAt: "2024-06-15T14:00:00.000Z",
      yearInEnd: true,
      yearInStart: true
    },
    {
      assertion:
        "treats events crossing midnight UTC but same day in Chicago as same-day",
      endsAt: "2024-06-16T04:00:00.000Z", // 11 PM Chicago Jun 15
      startsAt: "2024-06-16T02:00:00.000Z", // 9 PM Chicago Jun 15
      yearInEnd: false,
      yearInStart: false
    }
  ])("$assertion", ({ endsAt, startsAt, yearInEnd, yearInStart }) => {
    const result = eventRangeFormat(startsAt, endsAt);

    expect(result).toContain("–");

    const [start, end] = split(result, " – ");

    expect(start).toMatch(yearInStart ? /\d{4}/u : /^[^-–]+$/u);
    expect(end).toMatch(yearInEnd ? /\d{4}/u : /^[^-–]+$/u);
  });
});

const makeIso = (epoch: number) => {
  return DateTime.formatIso(DateTime.unsafeMake(epoch));
};

describe(getRelativeDate, () => {
  it.each([
    { assertion: "Today", label: "the current moment", offset: 0 },
    {
      assertion: "Today",
      label: "a date within the same rounding boundary",
      offset: 11 * 3_600_000
    },
    {
      assertion: "tomorrow",
      label: "1 day in the future",
      offset: 24 * 3_600_000
    },
    {
      assertion: "yesterday",
      label: "1 day in the past",
      offset: -24 * 3_600_000
    },
    {
      assertion: "in 3 days",
      label: "2–6 days in the future",
      offset: 72 * 3_600_000
    },
    {
      assertion: "3 days ago",
      label: "2–6 days in the past",
      offset: -72 * 3_600_000
    }
  ])('returns "$assertion" for $label', ({ assertion, offset }) => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(getRelativeDate(makeIso(NOW_MS + offset))).toBe(assertion);

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
      map(result, ({ _id }) => {
        return _id;
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
