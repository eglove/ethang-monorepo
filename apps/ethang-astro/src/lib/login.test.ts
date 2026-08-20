import { describe, expect, it } from "vitest";

import { resolveLoginOutcome, resolveLoginRedirect } from "./login.ts";

const APPLICATIONS_REDIRECT = "/applications";
const DEFAULT_REDIRECT = "/";

describe("resolveLoginRedirect", () => {
  it.each([
    [undefined, DEFAULT_REDIRECT],
    [null, DEFAULT_REDIRECT],
    [APPLICATIONS_REDIRECT, APPLICATIONS_REDIRECT],
    [
      `${APPLICATIONS_REDIRECT}?after=a%20cursor`,
      `${APPLICATIONS_REDIRECT}?after=a%20cursor`
    ],
    ["https://evil.example", DEFAULT_REDIRECT],
    ["//evil.example", DEFAULT_REDIRECT],
    [String.raw`/\\evil.example`, DEFAULT_REDIRECT],
    ["applications", DEFAULT_REDIRECT]
  ])("resolves login redirect %j", (input, expected) => {
    expect(resolveLoginRedirect(input)).toBe(expected);
  });
});

describe("resolveLoginOutcome", () => {
  it.each([
    {
      expected: { kind: "redirect" as const, path: APPLICATIONS_REDIRECT },
      name: "an action that succeeded",
      result: { data: { redirect: APPLICATIONS_REDIRECT, username: "ada" } }
    },
    {
      expected: { error: "Invalid Credentials", kind: "error" as const },
      name: "an action that failed",
      result: { error: { message: "Invalid Credentials" } }
    }
  ])("$name", ({ expected, result }) => {
    expect(resolveLoginOutcome(result, null)).toEqual(expected);
  });

  it("uses the requested redirect when a successful payload omits one", () => {
    expect(
      resolveLoginOutcome(
        { data: { username: "ada" } },
        null,
        APPLICATIONS_REDIRECT
      )
    ).toEqual({
      kind: "redirect",
      path: APPLICATIONS_REDIRECT
    });
  });

  it("renders the query error when no action ran", () => {
    expect(resolveLoginOutcome(undefined, "session expired")).toEqual({
      error: "session expired",
      kind: "error"
    });
  });

  it("renders no error when no action ran and no query error is present", () => {
    expect(resolveLoginOutcome(undefined, null)).toEqual({
      error: null,
      kind: "error"
    });
  });
});
