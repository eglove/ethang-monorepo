import { describe, expect, it } from "vitest";

import { gitMasterSkill, reviewMasterSkill } from "./index.ts";

describe("gitMasterSkill content", () => {
  it("proposes and stages files inline using ask_question", () => {
    expect(gitMasterSkill.content).not.toContain("stage-plan.md");
    expect(gitMasterSkill.content).toContain("ask_question");
    expect(gitMasterSkill.content).toContain("Stage these files");
  });

  it("updates lessons using ask_question tool", () => {
    expect(gitMasterSkill.content).toContain("ask_question");
  });

  it("performs quality review using invoke_subagent with research type in parallel", () => {
    expect(gitMasterSkill.content).toContain("invoke_subagent");
    expect(gitMasterSkill.content).toContain("research");
  });

  it("drafts and executes commit inline using ask_question", () => {
    expect(gitMasterSkill.content).not.toContain("commit-draft.md");
    expect(gitMasterSkill.content).toContain("ask_question");
    expect(gitMasterSkill.content).toContain("Execute this commit");
  });
});

describe("reviewMasterSkill content", () => {
  it("parallelizes intake using invoke_subagent with research type", () => {
    expect(reviewMasterSkill.content).toContain("invoke_subagent");
    expect(reviewMasterSkill.content).toContain("research");
  });

  it("approves the review plan using a native artifact review-plan.md", () => {
    expect(reviewMasterSkill.content).toContain("review-plan.md");
    expect(reviewMasterSkill.content).toContain("RequestFeedback");
  });

  it("spawns specialized review subagents and coordinates via send_message", () => {
    expect(reviewMasterSkill.content).toContain("define_subagent");
    expect(reviewMasterSkill.content).toContain("send_message");
  });

  it("spawns a specialized test-writer subagent for failing tests", () => {
    expect(reviewMasterSkill.content).toContain("test-writer");
  });

  it("writes the final comments to a native artifact review-comments.md", () => {
    expect(reviewMasterSkill.content).toContain("review-comments.md");
    expect(reviewMasterSkill.content).toContain("write_to_file");
    expect(reviewMasterSkill.content).toContain("UserFacing");
  });
});
