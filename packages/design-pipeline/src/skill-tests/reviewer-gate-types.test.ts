import includes from "lodash/includes.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
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
  "design-pipeline",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");
const lines = split(content, "\n");

const REVIEWING = "REVIEWING";
const REVIEW_PASSED = "REVIEW_PASSED";
const REVIEW_FAILED = "REVIEW_FAILED";
const REVISING = "REVISING";

describe("design-pipeline SKILL.md — reviewer gate task states", () => {
  it("does not contain CRLF line endings", () => {
    expect(content).not.toContain("\r\n");
  });

  it("contains REVIEWING as a documented task state", () => {
    expect(content).toContain(REVIEWING);
  });

  it("contains REVIEW_PASSED as a documented task state", () => {
    expect(content).toContain(REVIEW_PASSED);
  });

  it("contains REVIEW_FAILED as a documented task state", () => {
    expect(content).toContain(REVIEW_FAILED);
  });

  it("contains REVISING as a documented task state", () => {
    expect(content).toContain(REVISING);
  });
});

describe("design-pipeline SKILL.md — reviewer gate constants", () => {
  it("contains MaxReviewRevisions with value 3", () => {
    expect(content).toMatch(/MaxReviewRevisions\s*\|\s*3/u);
  });

  it("contains MaxReviewerRetries with value 2", () => {
    expect(content).toMatch(/MaxReviewerRetries\s*\|\s*2/u);
  });

  it("contains MinReviewQuorum with value 5", () => {
    expect(content).toMatch(/MinReviewQuorum\s*\|\s*5/u);
  });
});

describe("design-pipeline SKILL.md — ReviewVerdict schema", () => {
  it("contains ReviewVerdict section", () => {
    expect(content).toContain("ReviewVerdict");
  });

  it("contains verdict field", () => {
    const verdictIndex = some(lines, (line) => {
      return includes(line, "ReviewVerdict");
    });

    expect(verdictIndex).toBe(true);
    expect(content).toContain("verdict");
  });

  it("contains scope field with SESSION_DIFF and OUT_OF_SCOPE", () => {
    expect(content).toContain("scope");
    expect(content).toContain("SESSION_DIFF");
    expect(content).toContain("OUT_OF_SCOPE");
  });

  it("contains findings field", () => {
    expect(content).toContain("findings");
  });
});

describe("design-pipeline SKILL.md — reviewer gate transitions", () => {
  it("contains REVIEWING to REVIEW_PASSED transition", () => {
    const transitionLine = some(lines, (line) => {
      return includes(line, REVIEWING) && includes(line, REVIEW_PASSED);
    });

    expect(transitionLine).toBe(true);
  });

  it("contains REVIEW_FAILED to REVISING transition", () => {
    const transitionLine = some(lines, (line) => {
      return includes(line, REVIEW_FAILED) && includes(line, REVISING);
    });

    expect(transitionLine).toBe(true);
  });

  it("contains REVISING to REVIEWING transition (re-review cycle)", () => {
    const transitionLine = some(lines, (line) => {
      return includes(line, REVISING) && includes(line, REVIEWING);
    });

    expect(transitionLine).toBe(true);
  });
});
