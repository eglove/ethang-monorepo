import { describe, expect, it } from "vitest";

import { tddPipelineSkill } from "./pipeline.ts";

describe("tddPipelineSkill content", () => {
  it("has Step 1 for Task Intake via /grill-me", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 1: Task Intake"
    );
  });

  it("has Step 2 for Research & Analyze with subagent fan-out", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 2: Research & Analyze"
    );
  });

  it("has Step 3 for Requirements with native artifact approval", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 3: Requirements"
    );
  });

  it("has Step 4 for Root Cause Analysis (bug-shaped only)", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 4: Root Cause Analysis"
    );
  });

  it("has Step 5 for Plan + Approval Gate", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 5: Plan + Approval Gate"
    );
  });

  it("has Step 6 for RED with specialized subagent", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 6: RED"
    );
  });

  it("has Step 7 for GREEN with specialized subagent", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 7: GREEN"
    );
  });

  it("has Step 8 for Refactor & Summary", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Step 8: Refactor & Summary"
    );
  });

  it("references native CLI tools for multi-agent orchestration", () => {
    expect(tddPipelineSkill.content).toContain("invoke_subagent");
    expect(tddPipelineSkill.content).toContain("define_subagent");
    expect(tddPipelineSkill.content).toContain("send_message");
  });

  it("references write_to_file with RequestFeedback for approval gates", () => {
    expect(tddPipelineSkill.content).toContain("write_to_file");
    expect(tddPipelineSkill.content).toContain("RequestFeedback");
  });

  it("references schedule tool for long-running reminders", () => {
    expect(tddPipelineSkill.content).toContain("schedule");
  });

  it("references /grill-me, /goal, and /teamwork-preview", () => {
    expect(tddPipelineSkill.content).toContain("/grill-me");
    expect(tddPipelineSkill.content).toContain("/goal");
    expect(tddPipelineSkill.content).toContain("/teamwork-preview");
  });

  it("does not contain old 11-step headings", () => {
    expect(tddPipelineSkill.content).not.toContain(
      "## Step 2: Gather Linked Context"
    );
    expect(tddPipelineSkill.content).not.toContain(
      "## Step 9: GREEN"
    );
    expect(tddPipelineSkill.content).not.toContain(
      "## Step 11: Summary"
    );
  });

  it("has exactly 8 steps", () => {
    expect(tddPipelineSkill.content).toContain("## Step 8:");
    expect(tddPipelineSkill.content).not.toContain("## Step 9:");
  });
});
