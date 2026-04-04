import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const AGENT_PATH = resolve(
  import.meta.dirname,
  "../../../.claude/skills/reviewers/a11y-reviewer/AGENT.md",
);

describe("a11y-reviewer AGENT.md", () => {
  it("should exist at the expected path", () => {
    expect(() => {
      readFileSync(AGENT_PATH, "utf8");
    }).not.toThrow();
  });

  it("should contain WCAG 2.2 reference", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("WCAG 2.2");
  });

  it("should contain AA reference", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("AA");
  });

  it("should contain WAI-ARIA 1.2 reference", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("WAI-ARIA 1.2");
  });

  it("should have standard reviewer AGENT.md frontmatter", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toMatch(/^---\s*\n/);
    expect(content).toMatch(/name:\s*a11y-reviewer/);
    expect(content).toMatch(/description:\s*.+/);
  });

  it("should mention PASS/FAIL verdict output", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("PASS");
    expect(content).toContain("FAIL");
    expect(content.toLowerCase()).toContain("verdict");
  });

  it("should mention OUT_OF_SCOPE for non-UI diffs", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("OUT_OF_SCOPE");
  });
});
