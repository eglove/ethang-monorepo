import { describe, expect, it } from "vitest";

import { tddPipelineSkill } from "./pipeline.ts";

describe("tddPipelineSkill content", () => {
  it("interviews for intake using /grill-me", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 1: Task Intake (Interview via /grill-me)"
    );
  });

  it("gathers linked context in Step 2", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 2: Gather Linked Context"
    );
  });

  it("analyzes affected code in Step 3", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 3: Analyze Affected Code"
    );
  });

  it("performs requirements analysis in Step 4", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 4: Requirements Analysis"
    );
  });

  it("generates requirements definition in Step 5", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 5: Generate Requirements Definition"
    );
  });

  it("renumbers subsequent steps correctly", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 6: Root Cause Analysis (bug-shaped tasks only)"
    );
    expect(tddPipelineSkill.content).toContain(
      "## Step 7: Plan + Approval Gate (MANDATORY)"
    );
    expect(tddPipelineSkill.content).toContain(
      "## Step 8: RED — Write Failing Tests"
    );
    expect(tddPipelineSkill.content).toContain("## Step 9: GREEN — Implement");
    expect(tddPipelineSkill.content).toContain("## Step 10: Refactor");
    expect(tddPipelineSkill.content).toContain("## Step 11: Summary");
  });
});
