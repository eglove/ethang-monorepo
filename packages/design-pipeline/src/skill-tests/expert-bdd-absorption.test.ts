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
  "expert-bdd",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

const SHARED_CONVENTIONS_REF = ".claude/skills/shared/conventions.md";

describe("expert-bdd SKILL.md absorption", () => {
  it("contains all 8 scenario category tags", () => {
    const tags = [
      "@primary",
      "@alternative",
      "@negative",
      "@edge_case",
      "@boundary",
      "@data_driven",
      "@integration",
      "@quality_attribute",
      "@failure_recovery",
    ];

    for (const tag of tags) {
      expect(content).toContain(tag);
    }
  });

  it("contains Given/When/Then structure guidance", () => {
    expect(content).toContain("Given");
    expect(content).toContain("When");
    expect(content).toContain("Then");
    expect(content).toMatch(/Given.*precondition/u);
    expect(content).toMatch(/When.*action|When.*event/u);
    expect(content).toMatch(/Then.*observable.*outcome/u);
  });

  it("contains reference to observable behavior testing", () => {
    expect(content).toMatch(/observable behavior/iu);
    expect(content).toMatch(/not implementation details/iu);
  });

  it("does NOT contain file naming patterns like BDD-NN.SS or BDD-NN", () => {
    expect(content).not.toMatch(/BDD-\d+\.\d+/u);
    expect(content).not.toMatch(/BDD-NN/u);
  });

  it("does NOT contain ADR-Ready scoring", () => {
    expect(content).not.toMatch(/ADR-[Rr]eady/u);
  });

  it("does NOT contain validation error codes", () => {
    expect(content).not.toMatch(/\bE001\b/u);
    expect(content).not.toMatch(/\bE002\b/u);
    expect(content).not.toMatch(/\bE041\b/u);
  });

  it("contains a reference to shared conventions", () => {
    expect(content).toContain(SHARED_CONVENTIONS_REF);
  });

  it("uses LF line endings", () => {
    expect(content).not.toContain("\r\n");
  });
});
