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
  "questioner",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

const PIPELINE_STATE_FILE = "pipeline-state.md";

describe("questioner SKILL.md — pipeline state file write instructions", () => {
  it("references the pipeline state file", () => {
    expect(content).toContain(PIPELINE_STATE_FILE);
  });

  it("contains instructions to write Stage 1 results to the state file", () => {
    expect(content).toMatch(/stage 1/iu);
    expect(content).toMatch(/stageresult|stage.?result|status.*complete/iu);
  });

  it("includes a condition for pipeline context detection", () => {
    expect(content).toMatch(
      /pipeline.run|design.pipeline|pipeline.state\.md.*exists/iu,
    );
  });

  it("instructs writing Status, Artifact, and Timestamp fields", () => {
    expect(content).toMatch(/\*\*Status:\*\*/u);
    expect(content).toMatch(/\*\*Artifact:\*\*/u);
    expect(content).toMatch(/\*\*Timestamp:\*\*/u);
  });

  it("specifies section-scoped ownership — only Stage 1", () => {
    expect(content).toMatch(
      /only.*stage 1|do not modify.*other|section.scoped/iu,
    );
  });

  it("instructs validating the state file exists before writing", () => {
    expect(content).toMatch(/validate|verify|check.*exist/iu);
  });

  it("detects pipeline context via state file status CLEARED or ACCUMULATING", () => {
    expect(content).toMatch(/CLEARED/u);
    expect(content).toMatch(/ACCUMULATING/u);
  });
});
