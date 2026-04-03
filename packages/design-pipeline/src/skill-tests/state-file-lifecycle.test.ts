import findIndex from "lodash/findIndex.js";
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

const STATE_FILE_PATH = "docs/pipeline-state.md";

describe("design-pipeline SKILL.md — state file lifecycle", () => {
  it("contains a section heading about the pipeline state file", () => {
    const hasHeading = some(lines, (line) => {
      return includes(line, "State File") || includes(line, "Pipeline State");
    });

    expect(hasHeading).toBe(true);
  });

  it("references the state file path docs/pipeline-state.md", () => {
    expect(content).toContain(STATE_FILE_PATH);
  });

  it("contains 'fail-fast' in the context of clear failure", () => {
    expect(content).toContain("fail-fast");
  });

  it("contains section ownership rule", () => {
    const hasSectionOwnership =
      includes(content, "section ownership") ||
      includes(content, "section-scoped ownership") ||
      includes(content, "Section-Scoped Ownership");

    expect(hasSectionOwnership).toBe(true);
  });

  it("contains schema validation language", () => {
    const hasSchemaValidation =
      includes(content, "schema validation") ||
      includes(content, "Schema Validation") ||
      includes(content, "validates");

    expect(hasSchemaValidation).toBe(true);
  });

  it("contains 'terminal' in the context of commits", () => {
    const hasTerminalCommit = some(lines, (line) => {
      return includes(line, "terminal") && includes(line, "commit");
    });

    expect(hasTerminalCommit).toBe(true);
  });

  it("contains 'uncommitted' in the context of warning before clearing", () => {
    const hasUncommittedWarning = some(lines, (line) => {
      return includes(line, "uncommitted");
    });

    expect(hasUncommittedWarning).toBe(true);
  });

  it("includes docs/pipeline-state.md in the Output Locations table", () => {
    const outputLocationsIndex = findIndex(lines, (line) => {
      return includes(line, "## Output Locations");
    });

    expect(outputLocationsIndex).toBeGreaterThan(-1);

    const tableSlice = lines.slice(
      outputLocationsIndex,
      outputLocationsIndex + 20,
    );
    const hasStateFileRow = some(tableSlice, (line) => {
      return includes(line, STATE_FILE_PATH);
    });

    expect(hasStateFileRow).toBe(true);
  });

  it("references the state file path in the COMPLETE presentation block", () => {
    const completeIndex = findIndex(lines, (line) => {
      return includes(line, "Design Pipeline Complete");
    });

    expect(completeIndex).toBeGreaterThan(-1);

    const completeSlice = lines.slice(completeIndex, completeIndex + 25);
    const hasStateFile = some(completeSlice, (line) => {
      return includes(line, STATE_FILE_PATH);
    });

    expect(hasStateFile).toBe(true);
  });

  it("references the state file path in the HALTED presentation block", () => {
    const haltedIndex = findIndex(lines, (line) => {
      return includes(line, "Design Pipeline Halted");
    });

    expect(haltedIndex).toBeGreaterThan(-1);

    const haltedSlice = lines.slice(haltedIndex, haltedIndex + 15);
    const hasStateFile = some(haltedSlice, (line) => {
      return includes(line, STATE_FILE_PATH);
    });

    expect(hasStateFile).toBe(true);
  });
});
