import includes from "lodash/includes.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
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
const lines = split(content, "\n");

describe("design-pipeline SKILL.md — state documentation shed", () => {
  it("does NOT contain the heading '## Pipeline Change Tracking'", () => {
    const hasHeading = some(lines, (line) => {
      return includes(line, "## Pipeline Change Tracking");
    });

    expect(hasHeading).toBe(false);
  });

  it("does NOT contain the heading '## Accumulated Context'", () => {
    const hasHeading = some(lines, (line) => {
      return includes(line, "## Accumulated Context");
    });

    expect(hasHeading).toBe(false);
  });

  it("does NOT contain the heading '### Session File Format'", () => {
    const hasHeading = some(lines, (line) => {
      return includes(line, "### Session File Format");
    });

    expect(hasHeading).toBe(false);
  });

  it("does NOT contain 'docs/design-pipeline-sessions/' anywhere", () => {
    expect(content).not.toContain("docs/design-pipeline-sessions/");
  });

  it("does NOT contain 'Pipeline Session Index' in the Output Locations table", () => {
    expect(content).not.toContain("Pipeline Session Index");
  });

  it("still contains all six stage execution sections", () => {
    expect(content).toContain("### Stage 1");
    expect(content).toContain("### Stage 2");
    expect(content).toContain("### Stage 3");
    expect(content).toContain("### Stage 4");
    expect(content).toContain("### Stage 5");
    expect(content).toContain("### Stage 6");
  });
});
