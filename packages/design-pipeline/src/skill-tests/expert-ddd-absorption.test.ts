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
  "expert-ddd",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

const OPERATIONAL_GUIDANCE_HEADING = "## Operational Guidance";
const SHARED_CONVENTIONS_REF = ".claude/skills/shared/conventions.md";

describe("expert-ddd SKILL.md absorption", () => {
  it("contains an Operational Guidance section", () => {
    expect(content).toContain(OPERATIONAL_GUIDANCE_HEADING);
  });

  it("contains scaffolding directory structure keywords", () => {
    expect(content).toContain("Domain/Entities");
    expect(content).toContain("Domain/ValueObjects");
    expect(content).toContain("Domain/Aggregates");
    expect(content).toContain("Application/UseCases");
    expect(content).toContain("Infrastructure/Persistence");
  });

  it("contains dependency direction validation", () => {
    expect(content).toMatch(/Presentation\s*→\s*Application\s*→\s*Domain/u);
  });

  it("contains architecture violation detection for Domain importing Infrastructure", () => {
    expect(content).toMatch(/Domain.*import.*Infrastructure/iu);
  });

  it("does NOT contain a Read shared conventions instruction", () => {
    expect(content).not.toContain("Read shared conventions");
  });

  it("uses LF line endings", () => {
    expect(content).not.toContain("\r\n");
  });
});
