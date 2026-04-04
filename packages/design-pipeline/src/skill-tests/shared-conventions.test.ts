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
  "shared",
  "conventions.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

const LINE_ENDINGS_HEADING = "## Line Endings";
const ESLINT_CONFIG_HEADING = "## ESLint Config";
const VITEST_COVERAGE_HEADING = "## Vitest Coverage Thresholds";
const CSPELL_HEADING = "## CSpell";
const LODASH_HEADING = "## Prefer Lodash Over Vanilla Methods";
const NO_REPEATED_STRINGS_HEADING = "## No Repeated String Literals";
const FEATURE_DEV_AGENTS_HEADING = "## Feature Development Agents";
const OPPORTUNISTIC_HEADING = "## Opportunistic Code Improvement";

describe("shared conventions.md", () => {
  it("file exists and is non-empty", () => {
    expect(content.length).toBeGreaterThan(0);
  });

  it("contains a Line Endings section", () => {
    expect(content).toContain(LINE_ENDINGS_HEADING);
  });

  it("contains an ESLint Config section", () => {
    expect(content).toContain(ESLINT_CONFIG_HEADING);
  });

  it("contains a Vitest Coverage Thresholds section", () => {
    expect(content).toContain(VITEST_COVERAGE_HEADING);
  });

  it("contains a CSpell section", () => {
    expect(content).toContain(CSPELL_HEADING);
  });

  it("contains a Lodash section", () => {
    expect(content).toContain(LODASH_HEADING);
  });

  it("contains a No Repeated String Literals section", () => {
    expect(content).toContain(NO_REPEATED_STRINGS_HEADING);
  });

  it("does NOT contain a Feature Development Agents section", () => {
    expect(content).not.toContain(FEATURE_DEV_AGENTS_HEADING);
  });

  it("contains an Opportunistic Code Improvement section", () => {
    expect(content).toContain(OPPORTUNISTIC_HEADING);
  });

  it("does not contain CRLF line endings", () => {
    expect(content).not.toContain("\r\n");
  });

  it("does not contain placeholder text", () => {
    expect(content).not.toMatch(/\bTBD\b/u);
    expect(content).not.toMatch(/\bTODO\b/u);
  });
});
