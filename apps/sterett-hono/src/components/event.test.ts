import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getIsHappeningNow } from "./event.tsx";

const NOW = new Date("2024-06-15T14:00:00.000Z");

describe("getIsHappeningNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when now is between start and end", () => {
    expect(
      getIsHappeningNow("2024-06-15T13:00:00.000Z", "2024-06-15T15:00:00.000Z"),
    ).toBe(true);
  });

  it("returns true when now is exactly at start", () => {
    expect(
      getIsHappeningNow(NOW.toISOString(), "2024-06-15T16:00:00.000Z"),
    ).toBe(true);
  });

  it("returns true when now is exactly at end", () => {
    expect(
      getIsHappeningNow("2024-06-15T13:00:00.000Z", NOW.toISOString()),
    ).toBe(true);
  });

  it("returns false when now is before start", () => {
    expect(
      getIsHappeningNow("2024-06-15T15:00:00.000Z", "2024-06-15T17:00:00.000Z"),
    ).toBe(false);
  });

  it("returns false when now is after end", () => {
    expect(
      getIsHappeningNow("2024-06-15T10:00:00.000Z", "2024-06-15T12:00:00.000Z"),
    ).toBe(false);
  });

  it("returns false for a past event", () => {
    expect(
      getIsHappeningNow("2024-06-14T10:00:00.000Z", "2024-06-14T12:00:00.000Z"),
    ).toBe(false);
  });

  it("returns false for a future event", () => {
    expect(
      getIsHappeningNow("2024-06-16T10:00:00.000Z", "2024-06-16T12:00:00.000Z"),
    ).toBe(false);
  });
});
