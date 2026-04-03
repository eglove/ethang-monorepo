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
  "implementation-writer",
  "AGENT.md",
);

const content = readFileSync(AGENT_PATH, "utf8");

const PIPELINE_STATE_FILE = "pipeline-state.md";
const STAGE_5 = "Stage 5";

describe("implementation-writer AGENT.md — pipeline state file instructions", () => {
  it("references the pipeline state file", () => {
    expect(content).toContain(PIPELINE_STATE_FILE);
  });

  it("contains instructions about writing a Stage 5 StageResult section", () => {
    expect(content).toContain(STAGE_5);
    expect(content).toMatch(/stage 5.*stageresult/iu);
  });

  it("contains instructions about validating prior stages before writing", () => {
    expect(content).toMatch(/stage 1/iu);
    expect(content).toMatch(/stage 2/iu);
    expect(content).toMatch(/stage 3/iu);
    expect(content).toMatch(/stage 4/iu);
    expect(content).toMatch(/validat|check|verify|populated|present/iu);
  });

  it("describes the conditional detection for pipeline runs via ACCUMULATING status", () => {
    expect(content).toContain("ACCUMULATING");
  });

  it("instructs writing only to the Stage 5 section (section-scoped ownership)", () => {
    expect(content).toMatch(/only.*stage 5|stage 5.*only|section.scoped/iu);
  });

  it("includes Status, Artifact, and Timestamp fields in the Stage 5 output", () => {
    const pipelineSection = content.slice(content.indexOf(PIPELINE_STATE_FILE));
    expect(pipelineSection).toMatch(/status/iu);
    expect(pipelineSection).toMatch(/artifact/iu);
    expect(pipelineSection).toMatch(/timestamp/iu);
  });

  it("specifies COMPLETE as the status value", () => {
    expect(content).toContain("COMPLETE");
  });
});
