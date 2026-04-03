import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SKILL_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "agents",
  "expert-atomic-design",
  "SKILL.md",
);
const content = readFileSync(SKILL_PATH, "utf8");

describe("expert-atomic-design SKILL.md — absorbed atomic design methodology", () => {
  it("contains the Reuse-First Principle section with decision table", () => {
    expect(content).toContain("### The Reuse-First Principle");
    expect(content).toContain("Before creating ANY component");
    expect(content).toContain("### Decision Table");
    expect(content).toContain("Does something similar exist?");
    expect(content).toContain("Reuse/extend it");
    expect(content).toContain("Continue evaluation");
    expect(content).toContain("Will this be used in 2+ places?");
    expect(content).toContain("Is it truly indivisible?");
    expect(content).toContain("Does it combine 2-4 atoms?");
    expect(content).toContain("Is it a complete UI section?");
  });

  it("contains component categories with descriptions", () => {
    const categories = [
      "Atoms",
      "Molecules",
      "Organisms",
      "Templates",
      "Pages",
    ];

    for (const category of categories) {
      expect(content).toContain(`**${category}**`);
    }

    expect(content).toContain("### Component Categories");
    expect(content).toContain("Smallest, indivisible UI elements");
    expect(content).toContain("Simple combinations of 2-4 atoms");
    expect(content).toContain("Complex, distinct UI sections");
    expect(content).toContain("Page-level structural layouts");
    expect(content).toContain("Specific instances with real content");
  });

  it("contains anti-patterns section with all four anti-patterns", () => {
    expect(content).toContain("### Anti-Patterns to Avoid");
    expect(content).toContain("Creating when reusing works");
    expect(content).toContain("Feature-specific atoms");
    expect(content).toContain("Skipping levels");
    expect(content).toContain("Wrong abstraction level");
  });

  it("does NOT contain Linear workflow integration", () => {
    expect(content).not.toContain("Linear Workflow");
    expect(content).not.toContain("Integration with Linear");
  });

  it("contains a reference to shared conventions", () => {
    expect(content).toContain(".claude/skills/shared/conventions.md");
  });

  it("uses LF line endings", () => {
    expect(content).not.toContain("\r\n");
  });
});
