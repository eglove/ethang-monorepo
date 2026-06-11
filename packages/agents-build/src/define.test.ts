import { describe, expect, it } from "vitest";

import { defineRule, defineSkill } from "./define.ts";

describe("define functions", () => {
  it("defineRule returns the input rule", () => {
    const rule = {
      content: "x",
      filename: "test",
      trigger: "always_on" as const
    };
    expect(defineRule(rule)).toBe(rule);
  });

  it("defineSkill returns the input skill", () => {
    const skill = { content: "x", description: "desc", name: "test" };
    expect(defineSkill(skill)).toBe(skill);
  });
});
