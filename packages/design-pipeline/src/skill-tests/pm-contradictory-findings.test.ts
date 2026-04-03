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

describe("project-manager AGENT.md — contradictory reviewer findings", () => {
  it("contains documentation for contradictory reviewer findings", () => {
    expect(content).toMatch(/contradict.*finding|conflicting.*finding/iu);
  });

  it("specifies conflicting findings sent to pair (not arbitrated by project-manager)", () => {
    expect(content).toMatch(/sent to.*pair|pair.*reconcile/iu);
    const lines = content.split("\n");
    const arbitrateLine = lines.find((line: string) => {
      return (
        includes(line.toLowerCase(), "arbitrat") &&
        includes(line.toLowerCase(), "not")
      );
    });

    expect(arbitrateLine).toBeDefined();
  });

  it("specifies after MaxReviewRevisions, session fails with structured metadata", () => {
    expect(content).toMatch(/MaxReviewRevisions/u);
    expect(content).toMatch(/FAIL/u);
    expect(content).toMatch(/structured metadata/iu);
  });

  it("structured metadata includes which reviewers conflicted and on what", () => {
    expect(content).toMatch(/conflicting_reviewers/u);
    expect(content).toMatch(/conflict_details/u);
    expect(content).toMatch(/revision_history/u);
  });
});
