import { describe, expect, it } from "vitest";

import { gitWorkflow } from "./git-workflow.ts";
import { reviewPipeline } from "./review-pipeline.ts";

describe("gitWorkflow content", () => {
  it("has the correct rule properties", () => {
    expect(gitWorkflow.filename).toBe("git-workflow");
    expect(gitWorkflow.trigger).toBe("model_decision");
    expect(gitWorkflow.description).toBe(
      "staging changes, creating commits, amending commits, or generating git PRs"
    );
  });

  it("proposes, stages, and drafts commit inline in the chat", () => {
    expect(gitWorkflow.content).not.toContain("git-plan.md");
    expect(gitWorkflow.content).not.toContain("write_to_file");
    expect(gitWorkflow.content).toContain("inline");
  });

  it("updates lessons inline", () => {
    expect(gitWorkflow.content).not.toContain("ask_question");
    expect(gitWorkflow.content).toContain("inline");
  });

  it("mentions improvements to .agents", () => {
    expect(gitWorkflow.content).toContain(
      "opportunities to improve the agent rules, skills, or validation configuration located in `.agents`"
    );
  });

  it("performs quality review using invoke_subagent with research type in parallel", () => {
    expect(gitWorkflow.content).toContain("invoke_subagent");
    expect(gitWorkflow.content).toContain("research");
  });
});

describe("reviewPipeline content", () => {
  it("has the correct rule properties", () => {
    expect(reviewPipeline.filename).toBe("review-pipeline");
    expect(reviewPipeline.trigger).toBe("model_decision");
    expect(reviewPipeline.description).toBe(
      "reviewing pull requests, verifying code changes, or writing review comments"
    );
  });

  it("parallelizes intake using invoke_subagent with research type", () => {
    expect(reviewPipeline.content).toContain("invoke_subagent");
    expect(reviewPipeline.content).toContain("research");
  });

  it("approves the review plan using a native artifact review-plan.md", () => {
    expect(reviewPipeline.content).toContain("review-plan.md");
    expect(reviewPipeline.content).toContain("RequestFeedback");
  });

  it("spawns specialized review subagents and coordinates via send_message", () => {
    expect(reviewPipeline.content).toContain("define_subagent");
    expect(reviewPipeline.content).toContain("send_message");
  });

  it("spawns a specialized test-writer subagent for failing tests", () => {
    expect(reviewPipeline.content).toContain("test-writer");
  });

  it("writes the final comments to a native artifact review-comments.md", () => {
    expect(reviewPipeline.content).toContain("review-comments.md");
    expect(reviewPipeline.content).toContain("write_to_file");
    expect(reviewPipeline.content).toContain("UserFacing");
  });

  it("contains relative links with ./ instead of ../../rules/ for compiled rules", () => {
    expect(reviewPipeline.content).toContain("./role-reviewer.md");
    expect(reviewPipeline.content).toContain("./role-reporter.md");
    expect(reviewPipeline.content).toContain("./review-design-checklist.md");
    expect(reviewPipeline.content).toContain("./review-security-checklist.md");
    expect(reviewPipeline.content).toContain("./ddd-tactical.md");
    expect(reviewPipeline.content).not.toContain("../../rules/");
  });

  it("contains updated path for SWEBOK glossary skill", () => {
    expect(reviewPipeline.content).toContain("../skills/swebok/SKILL.md");
    expect(reviewPipeline.content).not.toContain("../swebok/SKILL.md");
  });

  it("includes cleanup instructions in Phase 5 for deleting temporary test files", () => {
    expect(reviewPipeline.content).toContain("delete");
    expect(reviewPipeline.content).toContain("temporary");
  });

  it("uses ASCII hyphen range 131-140 instead of en-dash", () => {
    expect(reviewPipeline.content).toContain("131-140");
    expect(reviewPipeline.content).not.toContain("131–140");
  });
});
