import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import toLower from "lodash/toLower.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SKILL_PATH = path.join(
  __dirname,
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

describe("design-pipeline SKILL.md — changeFlag mechanism", () => {
  it("contains the string 'changeFlag'", () => {
    expect(content).toContain("changeFlag");
  });

  it("contains text about atomic write via temp file then rename", () => {
    expect(content).toMatch(
      /temp.*rename|rename.*temp|\.tmp.*rename|rename.*\.tmp/iu,
    );
  });

  it("contains 'at most one' structural change rule (case-insensitive)", () => {
    expect(toLower(content)).toContain("at most one");
  });

  it("contains a rule that skips the update when changeFlag is FALSE", () => {
    expect(content).toMatch(/changeFlag\s*(?:=|is)\s*FALSE/u);
  });

  it("contains at least two structural-change category terms", () => {
    const terms = ["new expert", "stage role", "new stage", "stage ordering"];

    const matchCount = filter(terms, (term) =>
      includes(toLower(content), toLower(term)),
    ).length;

    expect(matchCount).toBeGreaterThanOrEqual(2);
  });

  it("states the original .puml remains unchanged if the rename fails", () => {
    expect(content).toMatch(
      /rename fails.*original|original.*remains unchanged/iu,
    );
  });

  it("references the file name 'design-pipeline.puml'", () => {
    expect(content).toContain("design-pipeline.puml");
  });

  it("contains text about Stage 6 completion triggering the puml update", () => {
    expect(content).toMatch(
      /stage\s*6.*complet|COMPLETE.*changeFlag|changeFlag.*COMPLETE/iu,
    );
  });
});
