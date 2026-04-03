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
  "project-manager",
  "AGENT.md",
);

const content = readFileSync(AGENT_PATH, "utf8");

describe("project-manager AGENT.md — scope/verdict consistency", () => {
  it("documents OUT_OF_SCOPE + PASS semantics", () => {
    expect(content).toMatch(/OUT_OF_SCOPE/u);
    expect(content).toMatch(/OUT_OF_SCOPE.*PASS|PASS.*OUT_OF_SCOPE/u);
  });

  it("requires at least one SESSION_DIFF-scoped PASS for gate pass", () => {
    expect(content).toMatch(/SESSION_DIFF/u);
    expect(content).toMatch(/at least one.*SESSION_DIFF.*PASS|SESSION_DIFF.*scoped.*PASS/iu);
  });

  it("explains OUT_OF_SCOPE verdicts count toward quorum but do not satisfy review alone", () => {
    expect(content).toMatch(/quorum/iu);
    expect(content).toMatch(/count toward quorum|toward.*quorum/iu);
    expect(content).toMatch(/all.*OUT_OF_SCOPE|OUT_OF_SCOPE.*pass.*vacuous/iu);
  });
});
