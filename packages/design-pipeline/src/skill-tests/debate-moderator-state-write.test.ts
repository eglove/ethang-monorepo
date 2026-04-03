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
  "orchestrators",
  "debate-moderator",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

const PIPELINE_STATE_FILE = "pipeline-state.md";
const STAGE_2 = "Stage 2";
const STAGE_4 = "Stage 4";

describe("debate-moderator SKILL.md — pipeline state file instructions", () => {
  it("references the pipeline state file", () => {
    expect(content).toContain(PIPELINE_STATE_FILE);
  });

  it("contains instructions about writing Stage 2 and Stage 4 StageResult sections", () => {
    expect(content).toContain(STAGE_2);
    expect(content).toContain(STAGE_4);
    expect(content).toMatch(/stage 2.*stageresult|stageresult.*stage 2/iu);
    expect(content).toMatch(/stage 4.*stageresult|stageresult.*stage 4/iu);
  });

  it("contains instructions about validating prior stages before writing", () => {
    expect(content).toMatch(/for stage 2.*stage 1/iu);
    expect(content).toMatch(/for stage 4/iu);
    expect(content).toMatch(/stages 1, 2, and 3/iu);
  });

  it("describes conditional detection for pipeline runs via ACCUMULATING status", () => {
    expect(content).toContain("ACCUMULATING");
  });

  it("instructs writing only to the assigned stage section (section-scoped ownership)", () => {
    expect(content).toMatch(
      /only.*assigned.*stage|section.scoped|do not modify.*other/iu,
    );
  });

  it("includes Status, Artifact, and Timestamp fields", () => {
    const pipelineSection = content.slice(content.indexOf(PIPELINE_STATE_FILE));

    expect(pipelineSection).toMatch(/\*\*Status:\*\*/u);
    expect(pipelineSection).toMatch(/\*\*Artifact:\*\*/u);
    expect(pipelineSection).toMatch(/\*\*Timestamp:\*\*/u);
  });

  it("mentions CONSENSUS REACHED and PARTIAL CONSENSUS as possible status values", () => {
    expect(content).toContain("CONSENSUS REACHED");
    expect(content).toContain("PARTIAL CONSENSUS");
  });

  it("reports validation failure to the caller when prior stages are missing", () => {
    expect(content).toMatch(/report.*error.*caller|error.*caller/iu);
  });
});
