import repeat from "lodash/repeat.js";
import { describe, expect, it } from "vitest";

import {
  applicationsLoginRedirect,
  applicationsPagePath,
  formatApplicationDate,
  formatApplicationValue,
  isApplicationStatus,
  isSafeApplicationUrl,
  parseApplicationCursor,
} from "./applications.ts";

const HTTP_APPLICATION_URL = ["http", "://acme.example/jobs/1"].join("");
const SCRIPT_APPLICATION_URL = ["java", "script:alert(1)"].join("");

describe("parseApplicationCursor", () => {
  it.each([
    [undefined, null],
    [null, null],
    ["", null],
    [repeat(" ", 3), null],
    ["cursor-1", "cursor-1"],
    ["  cursor-1  ", "cursor-1"],
  ])("parses cursor %j as %j", (input, expected) => {
    expect(parseApplicationCursor(input)).toBe(expected);
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
    [1, false],
  ])("validates status %j", (input, expected) => {
    expect(isApplicationStatus(input)).toBe(expected);
  });
});

describe("formatApplicationValue", () => {
  it.each([
    [undefined, "—"],
    [null, "—"],
    ["", "—"],
    ["Acme", "Acme"],
  ])("formats optional value %j", (input, expected) => {
    expect(formatApplicationValue(input)).toBe(expected);
  });
});

describe("formatApplicationDate", () => {
  it.each([
    [undefined, "—"],
    [null, "—"],
    ["", "—"],
    ["not-a-date", "not-a-date"],
    ["2026-08-01", "Aug 1, 2026"],
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
    [undefined, false],
  ])("validates %j as %j", (value, expected) => {
    expect(isSafeApplicationUrl(value)).toBe(expected);
  });
});

describe("application paths", () => {
  it("builds encoded page paths and a fixed login redirect", () => {
    expect(applicationsLoginRedirect()).toBe("/login?redirect=%2Fapplications");
    expect(applicationsPagePath(null)).toBe("/applications");
    expect(applicationsPagePath("a cursor")).toBe(
      "/applications?after=a%20cursor",
    );
  });
});
