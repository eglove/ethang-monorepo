import filter from "lodash/filter.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const TEMPLATE_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "docs",
  "pipeline-state.md",
);

const content = readFileSync(TEMPLATE_PATH, "utf8").replaceAll("\r\n", "\n");

const STATUS_FIELD = "**Status:**";
const ARTIFACT_FIELD = "**Artifact:**";
const TIMESTAMP_FIELD = "**Timestamp:**";

describe("docs/pipeline-state.md template", () => {
  it("is not empty", () => {
    expect(trim(content).length).toBeGreaterThan(0);
  });

  it("contains exactly 6 stage sections", () => {
    const stageHeadings = filter(split(content, "\n"), (line) => {
      return /^## Stage \d/u.test(line);
    });

    expect(stageHeadings).toHaveLength(6);
  });

  it("has Stage 1 through Stage 6 headings", () => {
    for (let index = 1; 6 >= index; index += 1) {
      expect(content).toContain(`## Stage ${String(index)}`);
    }
  });

  it("each stage section contains Status, Artifact, and Timestamp fields", () => {
    const stages = split(content, /^## Stage \d/mu).slice(1);

    expect(stages).toHaveLength(6);

    for (const stage of stages) {
      expect(stage).toContain(STATUS_FIELD);
      expect(stage).toContain(ARTIFACT_FIELD);
      expect(stage).toContain(TIMESTAMP_FIELD);
    }
  });

  it("run-level metadata section has Status set to CLEARED", () => {
    expect(content).toContain("**Status:** CLEARED");
  });

  it("Git section exists with Committed set to no", () => {
    expect(content).toContain("## Git");
    expect(content).toContain("**Committed:** no");
  });
});
