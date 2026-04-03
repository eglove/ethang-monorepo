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
  "tla-writer",
  "AGENT.md",
);

const content = readFileSync(AGENT_PATH, "utf8");

const PIPELINE_STATE_FILE = "pipeline-state.md";
const STAGE_3 = "Stage 3";

describe("tla-writer AGENT.md — pipeline state file instructions", () => {
  it("references the pipeline state file", () => {
    expect(content).toContain(PIPELINE_STATE_FILE);
  });

  it("contains instructions about writing a Stage 3 StageResult section", () => {
    expect(content).toContain(STAGE_3);
    expect(content).toMatch(/stage 3.*stageresult/iu);
  });

  it("contains instructions about validating prior stages before writing", () => {
    expect(content).toMatch(/stage 1/iu);
    expect(content).toMatch(/stage 2/iu);
    expect(content).toMatch(/validat|check|verify|populated|present/iu);
  });

  it("describes the conditional detection for pipeline runs via ACCUMULATING status", () => {
    expect(content).toContain("ACCUMULATING");
  });

  it("instructs writing only to the Stage 3 section (section-scoped ownership)", () => {
    expect(content).toMatch(/only.*stage 3|stage 3.*only|section.scoped/iu);
  });

  it("includes Status, Artifact, and Timestamp fields in the Stage 3 output", () => {
    const pipelineSection = content.slice(content.indexOf(PIPELINE_STATE_FILE));
    expect(pipelineSection).toMatch(/status/iu);
    expect(pipelineSection).toMatch(/artifact/iu);
    expect(pipelineSection).toMatch(/timestamp/iu);
  });

  it("mentions COMPLETE and UNVERIFIED as possible status values", () => {
    expect(content).toContain("COMPLETE");
    expect(content).toContain("UNVERIFIED");
  });
});
