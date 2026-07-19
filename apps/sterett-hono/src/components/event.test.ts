import { DateTime } from "effect";
import { describe, expect, it, vi } from "vitest";

import { getIsHappeningNow } from "./event.tsx";

const NOW_MS = DateTime.toEpochMillis(
  DateTime.unsafeMake("2024-06-15T14:00:00.000Z")
);

describe(getIsHappeningNow, () => {
  it.each([
    {
      endsAt: "2024-06-15T15:00:00.000Z",
      expected: true,
      startsAt: "2024-06-15T13:00:00.000Z"
    },
    {
      endsAt: "2024-06-15T16:00:00.000Z",
      expected: true,
      startsAt: DateTime.formatIso(DateTime.unsafeMake(NOW_MS))
    },
    {
      endsAt: DateTime.formatIso(DateTime.unsafeMake(NOW_MS)),
      expected: true,
      startsAt: "2024-06-15T13:00:00.000Z"
    },
    {
      endsAt: "2024-06-15T17:00:00.000Z",
      expected: false,
      startsAt: "2024-06-15T15:00:00.000Z"
    },
    {
      endsAt: "2024-06-15T12:00:00.000Z",
      expected: false,
      startsAt: "2024-06-15T10:00:00.000Z"
    },
    {
      endsAt: "2024-06-14T12:00:00.000Z",
      expected: false,
      startsAt: "2024-06-14T10:00:00.000Z"
    },
    {
      endsAt: "2024-06-16T12:00:00.000Z",
      expected: false,
      startsAt: "2024-06-16T10:00:00.000Z"
    }
  ])(
    "returns $expected when now is $startsAt to $endsAt",
    ({ endsAt, expected, startsAt }) => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW_MS);

      expect(getIsHappeningNow(startsAt, endsAt)).toBe(expected);

      vi.useRealTimers();
    }
  );
});
