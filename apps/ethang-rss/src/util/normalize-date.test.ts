import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeDate } from "./normalize-date.ts";

const MOCK_FALLBACK = "2026-06-14T12:00:00.000Z";
const MOCK_NORMALIZED = "2026-06-14T14:00:00.000Z";
const MOCK_SYSTEM_TIME_MS = 1_781_438_400_000; // 2026-06-14T12:00:00.000Z

describe("normalizeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_SYSTEM_TIME_MS);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should handle null, undefined, empty string, or whitespace by returning the current time in UTC", () => {
    expect(normalizeDate(null)).toBe(MOCK_FALLBACK);
    expect(normalizeDate()).toBe(MOCK_FALLBACK);
    expect(normalizeDate("")).toBe(MOCK_FALLBACK);
    expect(normalizeDate(" ")).toBe(MOCK_FALLBACK);
  });

  it("should handle invalid date strings by returning the current time in UTC", () => {
    expect(normalizeDate("invalid-date")).toBe(MOCK_FALLBACK);
    expect(normalizeDate("not a date")).toBe(MOCK_FALLBACK);
    expect(normalizeDate("Sun, 14 Jun 2026 14:00:00 UT")).toBe(MOCK_NORMALIZED);
    expect(normalizeDate("Sun, 14 Jun 2026 14:00:00 UTC")).toBe(
      MOCK_NORMALIZED
    );
  });

  it("should normalize valid ISO 8601 strings to UTC ISO 8601", () => {
    expect(normalizeDate("2026-06-14T10:00:00-04:00")).toBe(MOCK_NORMALIZED);
    expect(normalizeDate("2026-06-14T14:00:00Z")).toBe(MOCK_NORMALIZED);
    expect(normalizeDate("2026-06-14T14:00:00.123Z")).toBe(
      "2026-06-14T14:00:00.123Z"
    );
  });

  it("should normalize valid RFC 2822 strings to UTC ISO 8601", () => {
    // Numeric offsets
    expect(normalizeDate("Sun, 14 Jun 2026 10:00:00 -0400")).toBe(
      MOCK_NORMALIZED
    );
    expect(normalizeDate("Sun, 14 Jun 2026 14:00:00 +0000")).toBe(
      MOCK_NORMALIZED
    );

    // Standard GMT
    expect(normalizeDate("Sun, 14 Jun 2026 14:00:00 GMT")).toBe(
      MOCK_NORMALIZED
    );

    // US timezone abbreviations (EST/EDT) supported by Luxon's RFC 2822 parser
    expect(normalizeDate("Sun, 14 Jun 2026 09:00:00 EST")).toBe(
      MOCK_NORMALIZED
    );
    expect(normalizeDate("Sun, 14 Jun 2026 10:00:00 EDT")).toBe(
      MOCK_NORMALIZED
    ); // EDT is -0400
  });
});
