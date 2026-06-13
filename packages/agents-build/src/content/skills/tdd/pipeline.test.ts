import { describe, expect, it } from "vitest";

import { ciReviewPipelineSkill } from "./ci-review.ts";
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

  it("does not have Stage 5 for Verification & Validation", () => {
    expect(tddPipelineSkill.content).not.toContain(
      "## Stage 5: Production Phase — Verification & Validation"
    );
  });

  it("does not have Stage 6 for Utilization & Support Phase", () => {
    expect(tddPipelineSkill.content).not.toContain(
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

  it("has Stage 4 but not Stage 5 or 6", () => {
    expect(tddPipelineSkill.content).toContain("## Stage 4:");
    expect(tddPipelineSkill.content).not.toContain("## Stage 5:");
    expect(tddPipelineSkill.content).not.toContain("## Stage 6:");
  });
});

describe("ciReviewPipelineSkill content", () => {
  it("has Stage 5 for Verification & Validation", () => {
    expect(ciReviewPipelineSkill.content).toContain(
      "## Stage 5: Production Phase — Verification & Validation"
    );
  });

  it("Stage 5 requires committing and pushing to a PR branch and waiting for CI to finish before checking Sonar issues", () => {
    expect(ciReviewPipelineSkill.content).toContain("commit");
    expect(ciReviewPipelineSkill.content).toContain("push");
    expect(ciReviewPipelineSkill.content).toContain("PR branch");
    expect(ciReviewPipelineSkill.content).toContain("wait");
  });

  it("Stage 5 allows dynamically creating relevant reviewers in addition to the ones listed", () => {
    expect(ciReviewPipelineSkill.content).toContain("dynamically");
    expect(ciReviewPipelineSkill.content).toContain("reviewer");
  });

  it("Stage 5 requires going back to Stage 4 with red tests if issues are found", () => {
    expect(ciReviewPipelineSkill.content).toContain("Stage 4");
    expect(ciReviewPipelineSkill.content).toContain("red test");
  });

  it("has Stage 6 for Utilization & Support Phase", () => {
    expect(ciReviewPipelineSkill.content).toContain(
      "## Stage 6: Utilization & Support Phase"
    );
  });

  it("does not contain Stage 1 to 4", () => {
    expect(ciReviewPipelineSkill.content).not.toContain("## Stage 1:");
    expect(ciReviewPipelineSkill.content).not.toContain("## Stage 2:");
    expect(ciReviewPipelineSkill.content).not.toContain("## Stage 3:");
    expect(ciReviewPipelineSkill.content).not.toContain("## Stage 4:");
  });
});
