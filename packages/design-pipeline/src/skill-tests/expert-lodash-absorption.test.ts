import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SKILL_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "agents",
  "expert-lodash",
  "SKILL.md",
);
const content = readFileSync(SKILL_PATH, "utf8");

describe("expert-lodash SKILL.md absorption", () => {
  it("contains a Quick Reference section", () => {
    expect(content).toMatch(/^## Quick Reference$/mu);
  });

  it("contains the per-method import syntax example", () => {
    expect(content).toContain('import groupBy from "lodash/groupBy.js";');
  });

  it("contains the lodash/get array-path example", () => {
    expect(content).toContain('get(object, ["items", 0, "name"])');
  });

  it("explains why array-path form is preferred", () => {
    expect(content).toMatch(/ambigui/iu);
    expect(content).toMatch(/numeric ind/iu);
  });

  it("does NOT contain a Read shared conventions instruction", () => {
    expect(content).not.toContain("Read shared conventions");
  });

  it("uses LF line endings", () => {
    expect(content).not.toMatch(/\r\n/u);
  });
});
