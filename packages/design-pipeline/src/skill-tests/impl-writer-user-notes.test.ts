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

describe("implementation-writer AGENT.md — agent-scoped user_notes convention", () => {
  it("process step 7 references docs/user_notes/ directory", () => {
    expect(content).toContain("docs/user_notes/");
  });

  it("file naming pattern includes agent name and timestamp", () => {
    expect(content).toMatch(
      /implementation-writer-<YYYY-MM-DD>-<HH-MM-SS>\.md/u,
    );
  });

  it("creation logic creates the directory if absent (not a file with a header)", () => {
    expect(content).toMatch(/create.*directory|mkdir.*user_notes/iu);
    expect(content).not.toMatch(
      /create it with the standard header.*# User Notes/u,
    );
  });

  it("entry format includes requested_by field", () => {
    expect(content).toContain("requested_by");
  });

  it("entry format includes expert_needed field", () => {
    expect(content).toContain("expert_needed");
  });

  it("entry format includes rationale field", () => {
    expect(content).toContain("rationale");
  });

  it("entry format includes source_session field", () => {
    expect(content).toContain("source_session");
  });
});
