import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const AGENT_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "implementation-writer",
  "AGENT.md",
);

const content = readFileSync(AGENT_PATH, "utf8");

describe("implementation-writer AGENT.md — post-hoc user_notes annotation step", () => {
  it("contains a section describing post-hoc user_notes annotation", () => {
    expect(content).toMatch(/user_notes/iu);
  });

  it("describes the annotation step as occurring AFTER the plan is written/saved", () => {
    // The step must reference "after" the plan is written or saved
    const afterMatch =
      /after the (?:implementation plan|plan) (?:is (?:fully )?written|file is saved|has been (?:written|saved))/iu;
    expect(content).toMatch(afterMatch);
  });

  it("references docs/user_notes/ directory convention", () => {
    expect(content).toContain("docs/user_notes/");
  });

  it("describes handling of absent directory state", () => {
    expect(content).toMatch(/does not exist|missing/iu);
  });

  it("describes creating directory if absent", () => {
    expect(content).toMatch(/create.*directory/iu);
  });

  it("contains 'entries are user-curated'", () => {
    expect(content).toContain("entries are user-curated");
  });

  it("scopes annotation to missing CODE WRITER types only (not test writers, not experts)", () => {
    expect(content).toMatch(/code writer/iu);
    expect(content).toMatch(/not test writer|not.*test writer/iu);
  });

  it("entry format includes 'requested_by' field", () => {
    expect(content).toContain("requested_by");
  });

  it("entry format includes 'expert_needed' field", () => {
    expect(content).toContain("expert_needed");
  });

  it("entry format includes 'rationale' field", () => {
    expect(content).toContain("rationale");
  });

  it("entry format includes 'source_session' field", () => {
    expect(content).toContain("source_session");
  });
});
