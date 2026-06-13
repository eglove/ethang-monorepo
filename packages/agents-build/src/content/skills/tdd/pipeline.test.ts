import { describe, expect, it } from "vitest";

import { tddPipelineSkill } from "./pipeline.ts";

describe("tddPipelineSkill content", () => {
  it("has Stage 1 for Concept Phase", () => {
    expect(tddPipelineSkill.content).toContain("## Stage 1: Concept Phase");
  });

  it("has Stage 1.5 for Maintenance Triage", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Stage 1.5: Maintenance Triage"
    );
  });

  it("has Stage 2 for Requirements", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Stage 2: Development Phase — Requirements"
    );
  });

  it("has Stage 3 for Architecture & Design", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Stage 3: Development Phase — Architecture & Design + Threat Modeling"
    );
  });

  it("has Stage 4 for Construction & Integration (TDD Red/Green)", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Stage 4: Development Phase — Construction & Integration (TDD Red/Green)"
    );
  });

  it("has Stage 5 for Verification & Validation", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Stage 5: Production Phase — Verification & Validation"
    );
  });

  it("has Stage 6 for Utilization & Support Phase", () => {
    expect(tddPipelineSkill.content).toContain(
      "## Stage 6: Utilization & Support Phase"
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

  it("references /grill-me, /goal, and /teamwork-preview", () => {
    expect(tddPipelineSkill.content).toContain("/grill-me");
    expect(tddPipelineSkill.content).toContain("/goal");
    expect(tddPipelineSkill.content).toContain("/teamwork-preview");
  });

  it("does not contain old step headings", () => {
    expect(tddPipelineSkill.content).not.toContain("## Step 1:");
    expect(tddPipelineSkill.content).not.toContain("## Step 2:");
    expect(tddPipelineSkill.content).not.toContain("## Step 3:");
    expect(tddPipelineSkill.content).not.toContain("## Step 4:");
    expect(tddPipelineSkill.content).not.toContain("## Step 5:");
    expect(tddPipelineSkill.content).not.toContain("## Step 6:");
    expect(tddPipelineSkill.content).not.toContain("## Step 7:");
    expect(tddPipelineSkill.content).not.toContain("## Step 8:");
  });

  it("has exactly 7 stages (including 1.5)", () => {
    expect(tddPipelineSkill.content).toContain("## Stage 6:");
    expect(tddPipelineSkill.content).not.toContain("## Stage 7:");
  });
});
