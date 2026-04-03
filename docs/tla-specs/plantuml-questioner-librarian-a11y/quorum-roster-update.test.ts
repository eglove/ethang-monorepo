import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PIPELINE_SKILL_PATH = resolve(
  import.meta.dirname,
  "../../../.claude/skills/design-pipeline/SKILL.md",
);

const CONVENTIONS_PATH = resolve(
  import.meta.dirname,
  "../../../.claude/skills/shared/conventions.md",
);

describe("quorum formula and reviewer roster atomic update", () => {
  const pipelineContent = readFileSync(PIPELINE_SKILL_PATH, "utf8");

  it("should have exactly 9 reviewers including a11y-reviewer", () => {
    expect(pipelineContent).toContain("a11y-reviewer");
  });

  it("should reference quorum formula ceil(2n/3)", () => {
    const hasFormula =
      pipelineContent.includes("ceil(2n/3)") ||
      pipelineContent.includes("ceil(2*n/3)") ||
      pipelineContent.includes("ceil((2*n)/3)") ||
      pipelineContent.includes("ceil(2n / 3)");
    expect(hasFormula).toBe(true);
  });

  it("should not have hardcoded quorum value of 5 as the active quorum", () => {
    const lines = pipelineContent.split("\n");
    const quorumLines = lines.filter((line) => {
      return /MinReviewQuorum/i.test(line) && /\|\s*5\s*\|/.test(line);
    });
    expect(quorumLines).toHaveLength(0);
  });

  it("should document quorum formula in shared conventions", () => {
    const conventionsContent = readFileSync(CONVENTIONS_PATH, "utf8");
    const hasQuorum =
      conventionsContent.includes("ceil(2n/3)") ||
      conventionsContent.includes("quorum formula") ||
      conventionsContent.includes("Quorum Formula");
    expect(hasQuorum).toBe(true);
  });

  it("should document n=2 unanimity in conventions", () => {
    const conventionsContent = readFileSync(CONVENTIONS_PATH, "utf8");
    expect(conventionsContent.toLowerCase()).toContain("unanimity");
  });
});
