// cspell:ignore startuml enduml
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PUML_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "design-pipeline.puml",
);

const content = readFileSync(PUML_PATH, "utf8");

describe("design-pipeline.puml — state machine diagram", () => {
  it("starts with @startuml", () => {
    expect(content.trimStart()).toMatch(/^@startuml/u);
  });

  it("ends with @enduml", () => {
    expect(content.trimEnd()).toMatch(/@enduml$/u);
  });

  it("contains STAGE_1_QUESTIONER", () => {
    expect(content).toContain("STAGE_1_QUESTIONER");
  });

  it("contains STAGE_2_DESIGN_DEBATE", () => {
    expect(content).toContain("STAGE_2_DESIGN_DEBATE");
  });

  it("contains STAGE_3_TLA_WRITER", () => {
    expect(content).toContain("STAGE_3_TLA_WRITER");
  });

  it("contains STAGE_4_TLA_REVIEW", () => {
    expect(content).toContain("STAGE_4_TLA_REVIEW");
  });

  it("contains STAGE_5_IMPLEMENTATION", () => {
    expect(content).toContain("STAGE_5_IMPLEMENTATION");
  });

  it("contains STAGE_6_CONFIRMATION_GATE", () => {
    expect(content).toContain("STAGE_6_CONFIRMATION_GATE");
  });

  it("contains STAGE_6_TIER_EXECUTING", () => {
    expect(content).toContain("STAGE_6_TIER_EXECUTING");
  });

  it("contains STAGE_6_TIER_MERGING", () => {
    expect(content).toContain("STAGE_6_TIER_MERGING");
  });

  it("contains STAGE_6_INTER_TIER_VERIFICATION", () => {
    expect(content).toContain("STAGE_6_INTER_TIER_VERIFICATION");
  });

  it("contains STAGE_6_GLOBAL_REVIEW", () => {
    expect(content).toContain("STAGE_6_GLOBAL_REVIEW");
  });

  it("contains STAGE_6_FIX_SESSION", () => {
    expect(content).toContain("STAGE_6_FIX_SESSION");
  });

  it("contains COMPLETE", () => {
    expect(content).toContain("COMPLETE");
  });

  it("contains HALTED", () => {
    expect(content).toContain("HALTED");
  });

  it("contains at least one --> transition arrow", () => {
    expect(content).toMatch(/-->/u);
  });
});
