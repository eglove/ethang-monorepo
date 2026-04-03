// cspell:ignore arbitrat
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

describe("project-manager AGENT.md — contradictory reviewer findings", () => {
  it("contains documentation for contradictory reviewer findings", () => {
    expect(content).toMatch(/contradict.*finding|conflicting.*finding/iu);
  });

  it("specifies conflicting findings sent to pair (not arbitrated by project-manager)", () => {
    expect(content).toMatch(/sent to.*pair|pair.*reconcile/iu);
    const lines = split(content, "\n");
    const arbitrateLine = find(lines, (line: string) => {
      return (
        includes(toLower(line), "arbitrat") && includes(toLower(line), "not")
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
