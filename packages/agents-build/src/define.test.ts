import { describe, expect, it } from "vitest";

import { defineRule } from "./define.ts";

describe("define functions", () => {
  it("defineRule returns the input rule", () => {
    const rule = {
      content: "x",
      filename: "test",
      trigger: "always_on" as const
    };
    expect(defineRule(rule)).toBe(rule);
  });
});
