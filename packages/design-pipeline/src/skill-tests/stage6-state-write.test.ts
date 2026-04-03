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
  "design-pipeline",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");
const lines = split(content, "\n");

const PIPELINE_STATE_FILE = "pipeline-state.md";
const STAGE_6 = "Stage 6";

describe("design-pipeline SKILL.md — Stage 6 state file write instructions", () => {
  it("references writing the Stage 6 StageResult in pipeline-state.md", () => {
    expect(content).toMatch(/stage 6.*stageresult|stageresult.*stage 6/iu);
    expect(content).toContain(PIPELINE_STATE_FILE);
  });

  it("references committing the state file in the COMPLETE block", () => {
    const completeIndex = findIndex(lines, (line) => {
      return includes(line, "Terminal Artifact") || includes(line, "6g");
    });

    expect(completeIndex).toBeGreaterThan(-1);

    const completeSlice = lines.slice(completeIndex, completeIndex + 20);
    const hasCommitKeyword = some(completeSlice, (line) => {
      return includes(line, "commit") || includes(line, "Commit");
    });
    const hasStateFileReference = some(completeSlice, (line) => {
      return includes(line, "state file") || includes(line, "pipeline-state");
    });

    expect(hasCommitKeyword).toBe(true);
    expect(hasStateFileReference).toBe(true);
  });

  it("references committing the state file in the HALTED handling", () => {
    const haltedReasonIndex = findIndex(lines, (line) => {
      return includes(line, "HaltReasonConsistent");
    });

    expect(haltedReasonIndex).toBeGreaterThan(-1);

    const haltedSlice = lines.slice(haltedReasonIndex, haltedReasonIndex + 15);
    const hasCommitKeyword = some(haltedSlice, (line) => {
      return includes(line, "commit") || includes(line, "Commit");
    });
    const hasStateFileReference = some(haltedSlice, (line) => {
      return includes(line, "state file") || includes(line, "pipeline-state");
    });

    expect(hasCommitKeyword).toBe(true);
    expect(hasStateFileReference).toBe(true);
  });

  it("contains instructions about validating prior stages (1-5) before writing", () => {
    const stage6StateIndex = findIndex(lines, (line) => {
      return includes(line, STAGE_6) && includes(line, "State File");
    });

    expect(stage6StateIndex).toBeGreaterThan(-1);

    const stage6Slice = lines.slice(stage6StateIndex, stage6StateIndex + 25);
    const stage6Text = stage6Slice.join("\n");

    expect(stage6Text).toMatch(/stages? 1/iu);
    expect(stage6Text).toMatch(/stages? 5|stages? 1.5|prior/iu);
    expect(stage6Text).toMatch(/validat|verify|populated/iu);
  });
});
