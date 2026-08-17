import { describe, expect, it } from "vitest";

import { isStatus, nextStatus, type Status, STATUSES } from "./status.ts";

describe("status", () => {
  it.each([
    ["applied", "screening"],
    ["screening", "interview"],
    ["interview", "offer"],
    ["offer", null],
    ["rejected", null],
    ["withdrawn", null]
  ] as const)("nextStatus(%s) advances to %s", (from, to) => {
    expect(nextStatus(from)).toBe(to);
  });

  it.each(STATUSES)("isStatus accepts %s", (value) => {
    expect(isStatus(value)).toBe(true);
  });

  it.each(["", "APPLIED", "hired", "Interview", "screening "])(
    "isStatus rejects %s",
    (value) => {
      expect(isStatus(value)).toBe(false);
    }
  );

  it("types STATUSES as the complete union", () => {
    const values: readonly Status[] = STATUSES;
    expect(values).toHaveLength(6);
  });
});
