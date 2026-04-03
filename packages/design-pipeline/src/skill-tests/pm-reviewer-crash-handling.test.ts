import find from "lodash/find.js";
import includes from "lodash/includes.js";
import split from "lodash/split.js";
import toLower from "lodash/toLower.js";
import { readFileSync } from "node:fs";
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
  "project-manager",
  "AGENT.md",
);

const content = readFileSync(AGENT_PATH, "utf8");

describe("project-manager AGENT.md — reviewer crash/timeout handling", () => {
  it("contains crash/timeout handling documentation for reviewers", () => {
    expect(content).toMatch(/crash/iu);
    expect(content).toMatch(/timeout/iu);
    expect(content).toMatch(/reviewer/iu);
  });

  it("specifies MaxReviewerRetries (2) for retry bounds", () => {
    expect(content).toMatch(/MaxReviewerRetries/u);
    expect(content).toMatch(/MaxReviewerRetries/u);
    expect(content).toContain("2");
  });

  it("specifies UNAVAILABLE state when retries exhausted", () => {
    expect(content).toMatch(/UNAVAILABLE/u);
    expect(content).toMatch(/retries/iu);
    expect(content).toMatch(/exhaust/iu);
  });

  it("specifies MinReviewQuorum (5) for quorum fallback", () => {
    expect(content).toMatch(/MinReviewQuorum/u);
    expect(content).toMatch(/MinReviewQuorum/u);
    expect(content).toContain("5");
  });

  it("specifies that if quorum is not met, task FAILS", () => {
    expect(content).toMatch(/quorum/iu);
    const lines = split(content, "\n");
    const quorumLine = find(lines, (line: string) => {
      return (
        includes(toLower(line), "quorum") && includes(toLower(line), "fail")
      );
    });

    expect(quorumLine).toBeDefined();
  });

  it("documents the per-round retry reset as an explicit design decision", () => {
    expect(content).toMatch(/retry.*reset|reset.*retry/iu);
    expect(content).toMatch(/per.round|revision cycle|each.*round/iu);
  });
});
