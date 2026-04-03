import findIndex from "lodash/findIndex.js";
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
  "project-manager",
  "AGENT.md",
);

const content = readFileSync(SKILL_PATH, "utf8");
const lines = split(content, "\n");

describe("project-manager AGENT.md — reviewer gate integration", () => {
  it("Task States section includes REVIEWING, REVIEW_PASSED, REVIEW_FAILED, REVISING", () => {
    const taskStatesIndex = findIndex(lines, (line: string) => {
      return includes(line, "Task States");
    });

    expect(taskStatesIndex).toBeGreaterThan(-1);

    const taskStatesSlice = lines
      .slice(taskStatesIndex, taskStatesIndex + 30)
      .join("\n");

    expect(taskStatesSlice).toContain("REVIEWING");
    expect(taskStatesSlice).toContain("REVIEW_PASSED");
    expect(taskStatesSlice).toContain("REVIEW_FAILED");
    expect(taskStatesSlice).toContain("REVISING");
  });

  it("contains a Reviewer Gate or Review Phase or Review section", () => {
    const hasReviewSection = some(lines, (line) => {
      return /^#{1,3}\s.*(Reviewer Gate|Review Phase|Review)/u.test(line);
    });

    expect(hasReviewSection).toBe(true);
  });

  it("describes reviewer dispatch as parallel (all 8 reviewers)", () => {
    const hasParallel = some(lines, (line) => {
      return (
        (includes(line, "8") && includes(line, "reviewer")) ||
        includes(line, "parallel")
      );
    });

    expect(hasParallel).toBe(true);

    expect(content).toMatch(/all 8 reviewer|8 reviewer.*parallel|parallel/iu);
  });

  it("gate evaluation requires quorum (MinReviewQuorum or quorum)", () => {
    expect(content).toMatch(/MinReviewQuorum|quorum/iu);
  });

  it("all responded reviewers must pass", () => {
    expect(content).toMatch(
      /all responded.*pass|all.*responded.*PASS|every.*responded.*pass/iu,
    );
  });

  it("revision cycle bounded by MaxReviewRevisions (3)", () => {
    expect(content).toContain("MaxReviewRevisions");
    expect(content).toMatch(/MaxReviewRevisions/u);
    expect(content).toContain("3");
  });

  it("reviewer retries bounded by MaxReviewerRetries (2)", () => {
    expect(content).toContain("MaxReviewerRetries");
    expect(content).toMatch(/MaxReviewerRetries/u);
    expect(content).toContain("2");
  });

  it("documents full re-run rationale (safety over efficiency, any revision triggers full re-run)", () => {
    expect(content).toMatch(/safety over efficiency/iu);
    expect(content).toMatch(/full re-run|re-run.*all/iu);
  });

  it("project-manager mediates between pairs and reviewers (pairs never interact with reviewers directly)", () => {
    expect(content).toMatch(/mediate|mediates/iu);
    expect(content).toMatch(/pairs? never.*interact.*reviewer/iu);
  });

  it("handoff chain includes LOCAL_REVIEW -> Reviewers -> merge or revision", () => {
    expect(content).toContain("LOCAL_REVIEW");
    expect(content).toContain("REVIEWING");
    expect(content).toContain("REVIEW_PASSED");
    expect(content).toMatch(/REVIEW_PASSED.*MERGED|REVIEW_PASSED.*merge/iu);
    expect(content).toMatch(/REVIEW_FAILED.*REVISING|REVIEW_FAILED.*revis/iu);
  });
});
