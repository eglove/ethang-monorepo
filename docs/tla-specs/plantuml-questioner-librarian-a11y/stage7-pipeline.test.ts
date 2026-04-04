import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PIPELINE_SKILL_PATH = resolve(
  import.meta.dirname,
  "../../../.claude/skills/design-pipeline/SKILL.md",
);

const content = readFileSync(PIPELINE_SKILL_PATH, "utf8");

describe("Stage 7 in design-pipeline orchestrator", () => {
  it("should have Stage 7 with PlantUML and librarian as parallel tasks", () => {
    expect(content).toContain("Stage 7");
    expect(content.toLowerCase()).toContain("plantuml");
    expect(content.toLowerCase()).toContain("librarian");
  });

  it("should describe fork-join pattern", () => {
    const lowerContent = content.toLowerCase();
    const hasForkJoin =
      lowerContent.includes("fork-join") || lowerContent.includes("fork join");
    expect(hasForkJoin).toBe(true);
  });

  it("should document single atomic commit strategy", () => {
    const lowerContent = content.toLowerCase();
    expect(lowerContent).toContain("atomic commit");
  });

  it("should have pipeline stage count of 7", () => {
    expect(content).toContain("Stage 7");
  });

  it("should have Stage 7 follow Stage 6 in the stage sequence", () => {
    const stage6Index = content.indexOf("Stage 6");
    const stage7Index = content.indexOf("Stage 7");
    expect(stage6Index).toBeGreaterThan(-1);
    expect(stage7Index).toBeGreaterThan(-1);
    expect(stage7Index).toBeGreaterThan(stage6Index);
  });

  it("should document non-fatal failure for both tasks", () => {
    const lowerContent = content.toLowerCase();
    expect(lowerContent).toContain("non-fatal");
  });
});
