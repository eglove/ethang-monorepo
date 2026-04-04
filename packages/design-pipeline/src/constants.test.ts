import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  defaultPipelineConfig,
  GitStages,
  PairStage,
  type PipelineConfig,
  PipelineConfigSchema,
  type StageName,
  STAGES,
  StreamingStages,
} from "./constants.ts";

describe("Stage Constants", () => {
  it("defines all 7 stage constants", () => {
    expect(STAGES).toEqual([
      "Questioner",
      "DebateModerator",
      "TlaWriter",
      "ExpertReview",
      "ImplementationPlanning",
      "PairProgramming",
      "ForkJoin",
    ]);
  });

  it("all stage constants are unique", () => {
    const unique = new Set(STAGES);
    expect(unique.size).toBe(7);
  });

  it("StreamingStages contains exactly Questioner and ImplementationPlanning", () => {
    expect(StreamingStages).toEqual(
      new Set(["ImplementationPlanning", "Questioner"]),
    );
    expect(StreamingStages.size).toBe(2);
  });

  it("GitStages contains exactly PairProgramming and ForkJoin", () => {
    expect(GitStages).toEqual(new Set(["ForkJoin", "PairProgramming"]));
    expect(GitStages.size).toBe(2);
  });

  it("PairStage equals PairProgramming", () => {
    expect(PairStage).toBe("PairProgramming");
  });

  it("stage names are assignable to StageName type", () => {
    const stage: StageName = "Questioner";
    expect(STAGES).toContain(stage);
  });
});

describe("PipelineConfig", () => {
  it("parses valid config", () => {
    const config: PipelineConfig = PipelineConfigSchema.parse({
      maxRetries: 3,
      maxStreamTurns: 10,
      retryBaseDelayMs: 1000,
    });
    expect(config.maxRetries).toBe(3);
    expect(config.maxStreamTurns).toBe(10);
    expect(config.retryBaseDelayMs).toBe(1000);
  });

  it("rejects maxRetries < 1", () => {
    expect(() => {
      PipelineConfigSchema.parse({
        maxRetries: 0,
        maxStreamTurns: 10,
        retryBaseDelayMs: 1000,
      });
    }).toThrow(z.ZodError);
  });

  it("rejects maxStreamTurns < 1", () => {
    expect(() => {
      PipelineConfigSchema.parse({
        maxRetries: 3,
        maxStreamTurns: 0,
        retryBaseDelayMs: 1000,
      });
    }).toThrow(z.ZodError);
  });

  it("rejects non-integer maxRetries", () => {
    expect(() => {
      PipelineConfigSchema.parse({
        maxRetries: 1.5,
        maxStreamTurns: 10,
        retryBaseDelayMs: 1000,
      });
    }).toThrow(z.ZodError);
  });

  it("rejects negative retryBaseDelayMs", () => {
    expect(() => {
      PipelineConfigSchema.parse({
        maxRetries: 3,
        maxStreamTurns: 10,
        retryBaseDelayMs: -1,
      });
    }).toThrow(z.ZodError);
  });

  it("provides sensible defaults", () => {
    expect(defaultPipelineConfig.maxRetries).toBeGreaterThanOrEqual(1);
    expect(defaultPipelineConfig.maxStreamTurns).toBeGreaterThanOrEqual(1);
    expect(defaultPipelineConfig.retryBaseDelayMs).toBeGreaterThan(0);
  });
});
