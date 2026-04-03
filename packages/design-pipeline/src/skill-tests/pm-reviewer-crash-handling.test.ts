import includes from "lodash/includes.js";
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
    expect(content).toMatch(/crash.*timeout|timeout.*crash/iu);
    expect(content).toMatch(/reviewer/iu);
  });

  it("specifies MaxReviewerRetries (2) for retry bounds", () => {
    expect(content).toMatch(/MaxReviewerRetries/u);
    expect(content).toMatch(/MaxReviewerRetries.*2|2.*MaxReviewerRetries/u);
  });

  it("specifies UNAVAILABLE state when retries exhausted", () => {
    expect(content).toMatch(/UNAVAILABLE/u);
    expect(content).toMatch(/retries?.*exhaust|exhaust.*retries?/iu);
  });

  it("specifies MinReviewQuorum (5) for quorum fallback", () => {
    expect(content).toMatch(/MinReviewQuorum/u);
    expect(content).toMatch(/MinReviewQuorum.*5|5.*MinReviewQuorum/u);
  });

  it("specifies that if quorum is not met, task FAILS", () => {
    expect(content).toMatch(/quorum/iu);
    const quorumLine = content
      .split("\n")
      .find((line: string) => {
        return includes(line.toLowerCase(), "quorum") && includes(line.toLowerCase(), "fail");
      });

    expect(quorumLine).toBeDefined();
  });

  it("documents the per-round retry reset as an explicit design decision", () => {
    expect(content).toMatch(/retry.*reset|reset.*retry/iu);
    expect(content).toMatch(/per.round|revision cycle|each.*round/iu);
  });
});
