import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const SKILL_PATH = resolve(
  import.meta.dirname,
  "../../../.claude/skills/agents/expert-a11y/SKILL.md",
);

describe("expert-a11y SKILL.md", () => {
  it("should exist at the expected path", () => {
    expect(() => {
      readFileSync(SKILL_PATH, "utf8");
    }).not.toThrow();
  });

  it("should contain WCAG 2.2 reference", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    expect(content).toContain("WCAG 2.2");
  });

  it("should contain AA reference", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    expect(content).toContain("AA");
  });

  it("should contain WAI-ARIA 1.2 reference", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    expect(content).toContain("WAI-ARIA 1.2");
  });

  it("should have standard expert SKILL.md frontmatter with name field", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    expect(content).toMatch(/^---\s*\n/);
    expect(content).toMatch(/name:\s*expert-a11y/);
  });

  it("should have description field in frontmatter", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    expect(content).toMatch(/description:\s*.+/);
  });

  it("should not claim to be a reviewer", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const lowerContent = content.toLowerCase();
    expect(lowerContent).not.toContain("reviewer agent");
    expect(lowerContent).not.toContain("review gate");
  });
});
