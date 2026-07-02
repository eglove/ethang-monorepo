import { DateTime } from "effect";
import { describe, expect, it, vi } from "vitest";

import { getIsHappeningNow } from "./event.tsx";

const NOW_MS = DateTime.toEpochMillis(
  DateTime.unsafeMake("2024-06-15T14:00:00.000Z")
);

describe(getIsHappeningNow, () => {
  it("returns true when now is between start and end", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(
      getIsHappeningNow("2024-06-15T13:00:00.000Z", "2024-06-15T15:00:00.000Z")
    ).toBe(true);

    vi.useRealTimers();
  });

  it("returns true when now is exactly at start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    const nowIso = DateTime.formatIso(DateTime.unsafeMake(NOW_MS));

    expect(getIsHappeningNow(nowIso, "2024-06-15T16:00:00.000Z")).toBe(true);

    vi.useRealTimers();
  });

  it("returns true when now is exactly at end", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    const nowIso = DateTime.formatIso(DateTime.unsafeMake(NOW_MS));

    expect(getIsHappeningNow("2024-06-15T13:00:00.000Z", nowIso)).toBe(true);

    vi.useRealTimers();
  });

  it("returns false when now is before start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(
      getIsHappeningNow("2024-06-15T15:00:00.000Z", "2024-06-15T17:00:00.000Z")
    ).toBe(false);

    vi.useRealTimers();
  });

  it("returns false when now is after end", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(
      getIsHappeningNow("2024-06-15T10:00:00.000Z", "2024-06-15T12:00:00.000Z")
    ).toBe(false);

    vi.useRealTimers();
  });

  it("returns false for a past event", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(
      getIsHappeningNow("2024-06-14T10:00:00.000Z", "2024-06-14T12:00:00.000Z")
    ).toBe(false);

    vi.useRealTimers();
  });

  it("returns false for a future event", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    expect(
      getIsHappeningNow("2024-06-16T10:00:00.000Z", "2024-06-16T12:00:00.000Z")
    ).toBe(false);

    vi.useRealTimers();
  });
});
