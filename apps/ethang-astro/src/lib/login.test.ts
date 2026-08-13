import { describe, expect, it } from "vitest";

import { resolveLoginOutcome } from "./login.ts";

describe("resolveLoginOutcome", () => {
  it.each([
    {
      expected: { kind: "redirect" as const, path: "/" as const },
      name: "an action that succeeded",
      result: { data: { username: "ada" } }
    },
    {
      expected: { error: "Invalid Credentials", kind: "error" as const },
      name: "an action that failed",
      result: { error: { message: "Invalid Credentials" } }
    }
  ])("$name", ({ expected, result }) => {
    expect(resolveLoginOutcome(result, null)).toEqual(expected);
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
