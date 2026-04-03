import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const EXPERT_TDD_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "agents",
  "expert-tdd",
  "SKILL.md",
);
const VITEST_WRITER_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "vitest-writer",
  "AGENT.md",
);

const SHARED_CONVENTIONS_REF = ".claude/skills/shared/conventions.md";
const WRITE_TEST_FIRST = "Write the test first";
const FAILING_TEST = "failing test";
const MINIMUM_IMPLEMENTATION = "minimum implementation";

describe("expert-tdd SKILL.md TDD absorption", () => {
  const content = readFileSync(EXPERT_TDD_PATH, "utf8");

  it("contains 'Write the test first'", () => {
    expect(content).toContain(WRITE_TEST_FIRST);
  });

  it("describes red-green-refactor cycle", () => {
    expect(content).toContain(FAILING_TEST);
    expect(content).toContain(MINIMUM_IMPLEMENTATION);
    expect(content).toContain("Refactor");
  });

  it("references shared conventions", () => {
    expect(content).toContain(SHARED_CONVENTIONS_REF);
  });

  it("uses LF line endings", () => {
    expect(content).not.toContain("\r\n");
  });
});

describe("vitest-writer AGENT.md TDD absorption", () => {
  const content = readFileSync(VITEST_WRITER_PATH, "utf8");

  it("contains 'Use Vitest for all packages in this monorepo'", () => {
    expect(content).toContain("Use Vitest for all packages in this monorepo");
  });

  it("contains 'Tests live alongside the code they cover'", () => {
    expect(content).toContain("Tests live alongside the code they cover");
  });

  it("references shared conventions", () => {
    expect(content).toContain(SHARED_CONVENTIONS_REF);
  });

  it("uses LF line endings", () => {
    expect(content).not.toContain("\r\n");
  });
});
