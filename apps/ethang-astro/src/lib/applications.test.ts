import repeat from "lodash/repeat.js";
import { describe, expect, it } from "vitest";

import {
  applicationDatePagination,
  applicationsLoginRedirect,
  applicationsPagePath,
  formatApplicationDate,
  formatApplicationValue,
  isApplicationStatus,
  isSafeApplicationUrl,
  parseApplicationDateParam
} from "./applications.ts";

const HTTP_APPLICATION_URL = ["http", "://acme.example/jobs/1"].join("");
const SCRIPT_APPLICATION_URL = ["java", "script:alert(1)"].join("");
const AUGUST_DATE = "2026-08-01";
const JULY_DATE = "2026-07-30";
const JUNE_DATE = "2026-06-15";
const PLACEHOLDER = "—";
const INVALID_DATE = "not-a-date";

describe("parseApplicationDateParam", () => {
  it.each([
    [undefined, null],
    [null, null],
    ["", null],
    [repeat(" ", 3), null],
    [AUGUST_DATE, AUGUST_DATE],
    ["2026-8-1", null],
    [INVALID_DATE, null]
  ])("parses date param %j as %j", (input, expected) => {
    expect(parseApplicationDateParam(input)).toBe(expected);
  });
});

describe("isApplicationStatus", () => {
  it.each([
    [undefined, false],
    [null, false],
    ["applied", true],
    ["screening", true],
    ["interview", true],
    ["offer", true],
    ["rejected", true],
    ["withdrawn", true],
    ["unknown", false],
    [1, false]
  ])("validates status %j", (input, expected) => {
    expect(isApplicationStatus(input)).toBe(expected);
  });
});

describe("formatApplicationValue", () => {
  it.each([
    [undefined, PLACEHOLDER],
    [null, PLACEHOLDER],
    ["", PLACEHOLDER],
    ["Acme", "Acme"]
  ])("formats optional value %j", (input, expected) => {
    expect(formatApplicationValue(input)).toBe(expected);
  });
});

describe("formatApplicationDate", () => {
  it.each([
    [undefined, PLACEHOLDER],
    [null, PLACEHOLDER],
    ["", PLACEHOLDER],
    [INVALID_DATE, INVALID_DATE],
    ["2026-08-01", "Aug 1, 2026"]
  ])("formats date %j as %j", (input, expected) => {
    expect(formatApplicationDate(input)).toBe(expected);
  });
});

describe("safe application URLs", () => {
  it.each([
    ["https://acme.example/jobs/1", true],
    [HTTP_APPLICATION_URL, true],
    [SCRIPT_APPLICATION_URL, false],
    ["data:text/html,unsafe", false],
    ["//acme.example/jobs/1", false],
    ["not-a-url", false],
    [String.raw`https:\\evil.example`, false],
    [null, false],
    [undefined, false]
  ])("validates %j as %j", (value, expected) => {
    expect(isSafeApplicationUrl(value)).toBe(expected);
  });
});

describe("application paths", () => {
  it("builds encoded date paths and a fixed login redirect", () => {
    expect(applicationsLoginRedirect()).toBe("/login?redirect=%2Fapplications");
    expect(applicationsPagePath(null)).toBe("/applications");
    expect(applicationsPagePath(AUGUST_DATE)).toBe(
      `/applications?date=${AUGUST_DATE}`
    );
  });
});

describe("applicationDatePagination", () => {
  const DATES = [AUGUST_DATE, JULY_DATE, JUNE_DATE];

  it("builds formatted entries for every date", () => {
    const { entries } = applicationDatePagination(DATES, AUGUST_DATE);
    expect(entries).toStrictEqual([
      { href: `/applications?date=${AUGUST_DATE}`, label: "Aug 1, 2026" },
      { href: `/applications?date=${JULY_DATE}`, label: "Jul 30, 2026" },
      { href: `/applications?date=${JUNE_DATE}`, label: "Jun 15, 2026" }
    ]);
  });

  it.each([
    { currentIndex: 0, selected: null },
    { currentIndex: 0, selected: "2000-01-01" },
    { currentIndex: 1, selected: JULY_DATE },
    { currentIndex: 2, selected: JUNE_DATE }
  ])(
    "selects index $currentIndex for selected %j",
    ({ currentIndex, selected }) => {
      expect(applicationDatePagination(DATES, selected).currentIndex).toBe(
        currentIndex
      );
    }
  );

  it("returns no entries and no selection without dates", () => {
    expect(applicationDatePagination([], AUGUST_DATE)).toStrictEqual({
      currentIndex: -1,
      entries: []
    });
  });
});
