import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const SKILL_PATH = resolve(
  import.meta.dirname,
  "../../../.claude/skills/questioner/SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

describe("questioner SKILL.md freeform rewrite", () => {
  it("should not mandate the fixed 10-branch decision tree as ordered steps", () => {
    const fixedBranches = [
      "Branch 1:",
      "Branch 2:",
      "Branch 3:",
      "Branch 4:",
      "Branch 5:",
      "Branch 6:",
      "Branch 7:",
      "Branch 8:",
      "Branch 9:",
      "Branch 10:",
    ];

    for (const branch of fixedBranches) {
      expect(content).not.toContain(branch);
    }
  });

  it("should contain completeness check text", () => {
    const hasCompleteness =
      content.includes("completeness check") ||
      content.includes("completeness self-check") ||
      content.includes("Completeness Check");
    expect(hasCompleteness).toBe(true);
  });

  it("should contain a hard turn cap with numeric value", () => {
    const hasMaxTurns = /MaxTurns[:\s*]*\d+/i.test(content);
    expect(hasMaxTurns).toBe(true);
  });

  it("should retain one question per message rule", () => {
    expect(content.toLowerCase()).toContain("one question per message");
  });

  it("should retain Phase 1 Orient", () => {
    expect(content).toContain("Phase 1");
    expect(content).toContain("Orient");
  });

  it("should retain Phase 2 Question", () => {
    expect(content).toContain("Phase 2");
    expect(content).toContain("Question");
  });

  it("should retain Phase 3 Sign-Off", () => {
    expect(content).toContain("Phase 3");
    expect(content).toContain("Sign-Off");
  });

  it("should retain Phase 4 Save and Dispatch", () => {
    expect(content).toContain("Phase 4");
    expect(content).toContain("Save");
    expect(content).toContain("Dispatch");
  });
});
