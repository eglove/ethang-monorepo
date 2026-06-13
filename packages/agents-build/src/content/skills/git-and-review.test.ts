import { describe, expect, it } from "vitest";

import { gitMasterSkill, reviewMasterSkill } from "./index.ts";

describe("gitMasterSkill content", () => {
  it("proposes, stages, and drafts commit inline in the chat", () => {
    expect(gitMasterSkill.content).not.toContain("git-plan.md");
    expect(gitMasterSkill.content).not.toContain("write_to_file");
    expect(gitMasterSkill.content).toContain("inline");
  });

  it("updates lessons inline", () => {
    expect(gitMasterSkill.content).not.toContain("ask_question");
    expect(gitMasterSkill.content).toContain("inline");
  });

  it("has a simplified description without ask_question", () => {
    expect(gitMasterSkill.description).not.toContain("ask_question");
    expect(gitMasterSkill.description).toContain("inline");
  });

  it("mentions improvements to .agents", () => {
    expect(gitMasterSkill.content).toContain(
      "opportunities to improve the agent rules, skills, or validation configuration located in `.agents`"
    );
  });

  it("performs quality review using invoke_subagent with research type in parallel", () => {
    expect(gitMasterSkill.content).toContain("invoke_subagent");
    expect(gitMasterSkill.content).toContain("research");
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
