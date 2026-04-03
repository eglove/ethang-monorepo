import { existsSync, readFileSync } from "node:fs";
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
  "reviewers",
  "compliance-reviewer",
  "AGENT.md",
);

describe("compliance-reviewer AGENT.md", () => {
  it("file exists and is non-empty", () => {
    expect(existsSync(AGENT_PATH)).toBe(true);
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content.length).toBeGreaterThan(0);
  });

  const content = readFileSync(AGENT_PATH, "utf8");

  it("contains YAML frontmatter with name: compliance-reviewer", () => {
    expect(content).toMatch(/^---\n/u);
    expect(content).toMatch(/name:\s*compliance-reviewer/u);
  });

  it("specifies upstream specs as required inputs (briefing, design consensus, TLA+ spec)", () => {
    expect(content).toMatch(/briefing/iu);
    expect(content).toMatch(/design consensus/iu);
    expect(content).toMatch(/TLA\+?\s*spec/iu);
  });

  it("specifies review criteria: scope compliance", () => {
    expect(content).toMatch(/scope compliance/iu);
  });

  it("specifies review criteria: design consensus adherence", () => {
    expect(content).toMatch(/design consensus adherence/iu);
  });

  it("specifies review criteria: TLA+ state coverage", () => {
    expect(content).toMatch(/TLA\+?\s*state coverage/iu);
  });

  it("contains self-scoping rule (session diff only, pre-existing issues to user_notes)", () => {
    expect(content).toMatch(/session diff/iu);
    expect(content).toMatch(/pre-existing/iu);
    expect(content).toMatch(/user_notes/iu);
  });

  it("contains out-of-domain behavior (PASS with OUT_OF_SCOPE)", () => {
    expect(content).toMatch(/OUT_OF_SCOPE/u);
    expect(content).toMatch(/PASS/u);
  });

  it("contains structured ReviewVerdict output with verdict, scope, findings", () => {
    expect(content).toMatch(/ReviewVerdict/u);
    expect(content).toMatch(/verdict/u);
    expect(content).toMatch(/scope/u);
    expect(content).toMatch(/findings/u);
  });

  it("states the reviewer never interacts with pairs directly", () => {
    expect(content).toMatch(/never.*interact.*(?:pair|directly)|no.*direct.*(?:interaction|contact).*pair/iu);
  });

  it("does not contain CRLF line endings", () => {
    expect(content).not.toContain("\r\n");
  });
});
