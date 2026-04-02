import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const AGENT_PATH = path.join(
  __dirname,
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

describe("implementation-writer AGENT.md — post-hoc user_notes.md annotation step", () => {
  it("contains a section describing post-hoc user_notes.md annotation", () => {
    expect(content).toMatch(/user_notes\.md/iu);
  });

  it("describes the annotation step as occurring AFTER the plan is written/saved", () => {
    // The step must reference "after" the plan is written or saved
    const afterMatch =
      /after the (?:implementation plan|plan) (?:is (?:fully )?written|file is saved|has been (?:written|saved))/iu;
    expect(content).toMatch(afterMatch);
  });

  it("contains the exact header string '# User Notes — Agent Requests'", () => {
    expect(content).toContain("# User Notes — Agent Requests");
  });

  it("describes handling of ABSENT (file missing) state", () => {
    expect(content).toMatch(/absent|does not exist|missing/iu);
  });

  it("describes handling of EMPTY (zero bytes) file state", () => {
    expect(content).toMatch(/empty|zero bytes/iu);
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
