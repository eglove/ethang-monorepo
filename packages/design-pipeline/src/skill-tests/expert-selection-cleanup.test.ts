import find from "lodash/find.js";
import includes from "lodash/includes.js";
import split from "lodash/split.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SKILL_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "design-pipeline",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

describe("design-pipeline SKILL.md — expert-selection cleanup", () => {
  it("does NOT contain 'Expert Council' (case-sensitive)", () => {
    expect(content).not.toContain("Expert Council");
  });

  it("does NOT contain 'expert list' in accumulated context or stage input descriptions", () => {
    expect(content).not.toContain("expert list");
  });

  it("Stage 1 diagram label does NOT contain 'expert selection'", () => {
    const stage1DiagramLine = find(split(content, "\n"), (line) => {
      return includes(line, "Stage 1: Questioner") && includes(line, "───");
    });

    expect(stage1DiagramLine).toBeDefined();
    expect(stage1DiagramLine).not.toMatch(/expert selection/iu);
  });

  it("does NOT contain the constraint 'Expert selection from Stage 1 is reused'", () => {
    expect(content).not.toContain("Expert selection from Stage 1 is reused");
  });

  it("Stages 2 and 4 input sections do NOT reference expert list from Stage 1", () => {
    expect(content).not.toContain("The expert list confirmed in Stage 1");
    expect(content).not.toContain("The same expert list from Stage 1");
  });

  it("still contains 'Stage 1' and 'Questioner' (Stage 1 itself is preserved)", () => {
    expect(content).toContain("Stage 1");
    expect(content).toContain("Questioner");
  });
});
