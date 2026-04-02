import isEqual from "lodash/isEqual.js";
import size from "lodash/size.js";
import { describe, expect, it } from "vitest";

import {
  ACTIVE_PHASES,
  ALL_ARTIFACT_NAMES,
  type ArtifactName,
  ARTIFACTS_PRODUCED_BY,
  type HaltReason,
  MAX_PIPELINE_RETRIES,
  MAX_VALIDATION_ATTEMPTS,
  NON_TERMINAL_PHASES,
  PHASE_1_CLEAR_SET,
  PHASE_3_CLEAR_SET,
  PHASE_ORD,
  type PipelinePhase,
  RETRYABLE_PHASES,
  TERMINAL_PHASES,
  VALIDATED_PHASES,
} from "./pipeline-phases.js";

const IDLE: PipelinePhase = "IDLE";
const PHASE_1: PipelinePhase = "PHASE_1_QUESTIONER";
const PHASE_2: PipelinePhase = "PHASE_2_DESIGN_DEBATE";
const PHASE_3: PipelinePhase = "PHASE_3_TLA_WRITER";
const PHASE_4: PipelinePhase = "PHASE_4_TLA_REVIEW";
const PHASE_5: PipelinePhase = "PHASE_5_IMPLEMENTATION";
const PHASE_6: PipelinePhase = "PHASE_6_PAIR_PROGRAMMING";
const COMPLETE: PipelinePhase = "COMPLETE";
const HALTED: PipelinePhase = "HALTED";

describe("pipeline phases", () => {
  describe("phase sets", () => {
    it("TERMINAL_PHASES contains exactly COMPLETE and HALTED", () => {
      expect(TERMINAL_PHASES.size).toBe(2);
      expect(TERMINAL_PHASES.has(COMPLETE)).toBe(true);
      expect(TERMINAL_PHASES.has(HALTED)).toBe(true);
    });

    it("NON_TERMINAL_PHASES contains exactly 7 phases", () => {
      expect(NON_TERMINAL_PHASES.size).toBe(7);
      expect(NON_TERMINAL_PHASES.has(IDLE)).toBe(true);
      expect(NON_TERMINAL_PHASES.has(PHASE_1)).toBe(true);
      expect(NON_TERMINAL_PHASES.has(PHASE_2)).toBe(true);
      expect(NON_TERMINAL_PHASES.has(PHASE_3)).toBe(true);
      expect(NON_TERMINAL_PHASES.has(PHASE_4)).toBe(true);
      expect(NON_TERMINAL_PHASES.has(PHASE_5)).toBe(true);
      expect(NON_TERMINAL_PHASES.has(PHASE_6)).toBe(true);
      expect(NON_TERMINAL_PHASES.has(COMPLETE)).toBe(false);
      expect(NON_TERMINAL_PHASES.has(HALTED)).toBe(false);
    });

    it("ACTIVE_PHASES equals NON_TERMINAL minus IDLE (6 phases)", () => {
      expect(ACTIVE_PHASES.size).toBe(6);
      expect(ACTIVE_PHASES.has(IDLE)).toBe(false);

      for (const phase of NON_TERMINAL_PHASES) {
        if (phase !== IDLE) {
          expect(ACTIVE_PHASES.has(phase)).toBe(true);
        }
      }
    });

    it("VALIDATED_PHASES contains PHASE_1 through PHASE_5 (5 phases)", () => {
      expect(VALIDATED_PHASES.size).toBe(5);
      expect(VALIDATED_PHASES.has(PHASE_1)).toBe(true);
      expect(VALIDATED_PHASES.has(PHASE_2)).toBe(true);
      expect(VALIDATED_PHASES.has(PHASE_3)).toBe(true);
      expect(VALIDATED_PHASES.has(PHASE_4)).toBe(true);
      expect(VALIDATED_PHASES.has(PHASE_5)).toBe(true);
      expect(VALIDATED_PHASES.has(PHASE_6)).toBe(false);
    });

    it("RETRYABLE_PHASES contains PHASE_1_QUESTIONER and PHASE_3_TLA_WRITER", () => {
      expect(RETRYABLE_PHASES.size).toBe(2);
      expect(RETRYABLE_PHASES.has(PHASE_1)).toBe(true);
      expect(RETRYABLE_PHASES.has(PHASE_3)).toBe(true);
    });
  });

  describe("phase ordering", () => {
    it("PHASE_ORD maps IDLE=0 through HALTED=8", () => {
      expect(PHASE_ORD[IDLE]).toBe(0);
      expect(PHASE_ORD[PHASE_1]).toBe(1);
      expect(PHASE_ORD[PHASE_2]).toBe(2);
      expect(PHASE_ORD[PHASE_3]).toBe(3);
      expect(PHASE_ORD[PHASE_4]).toBe(4);
      expect(PHASE_ORD[PHASE_5]).toBe(5);
      expect(PHASE_ORD[PHASE_6]).toBe(6);
      expect(PHASE_ORD[COMPLETE]).toBe(7);
      expect(PHASE_ORD[HALTED]).toBe(8);
      expect(size(PHASE_ORD)).toBe(9);
    });
  });

  describe("constants", () => {
    it("MAX_PIPELINE_RETRIES is 3", () => {
      expect(MAX_PIPELINE_RETRIES).toBe(3);
    });

    it("MAX_VALIDATION_ATTEMPTS is 3", () => {
      expect(MAX_VALIDATION_ATTEMPTS).toBe(3);
    });
  });

  describe("artifacts", () => {
    it("ALL_ARTIFACT_NAMES contains all 6 artifact names", () => {
      const expectedNames: ArtifactName[] = [
        "briefingPath",
        "designConsensusPath",
        "implementationPlanPath",
        "tlaReviewPath",
        "tlaSpecPath",
        "tlcResult",
      ];

      expect(ALL_ARTIFACT_NAMES.size).toBe(6);

      for (const name of expectedNames) {
        expect(ALL_ARTIFACT_NAMES.has(name)).toBe(true);
      }
    });

    it("ARTIFACTS_PRODUCED_BY maps each phase to its artifact set", () => {
      expect(ARTIFACTS_PRODUCED_BY[PHASE_1].has("briefingPath")).toBe(true);
      expect(ARTIFACTS_PRODUCED_BY[PHASE_1].size).toBe(1);

      expect(ARTIFACTS_PRODUCED_BY[PHASE_2].has("designConsensusPath")).toBe(
        true,
      );
      expect(ARTIFACTS_PRODUCED_BY[PHASE_2].size).toBe(1);

      expect(ARTIFACTS_PRODUCED_BY[PHASE_3].has("tlaSpecPath")).toBe(true);
      expect(ARTIFACTS_PRODUCED_BY[PHASE_3].size).toBe(1);

      expect(ARTIFACTS_PRODUCED_BY[PHASE_4].has("tlcResult")).toBe(true);
      expect(ARTIFACTS_PRODUCED_BY[PHASE_4].has("tlaReviewPath")).toBe(true);
      expect(ARTIFACTS_PRODUCED_BY[PHASE_4].size).toBe(2);

      expect(ARTIFACTS_PRODUCED_BY[PHASE_5].has("implementationPlanPath")).toBe(
        true,
      );
      expect(ARTIFACTS_PRODUCED_BY[PHASE_5].size).toBe(1);

      // Phases that produce no artifacts
      expect(ARTIFACTS_PRODUCED_BY[IDLE].size).toBe(0);
      expect(ARTIFACTS_PRODUCED_BY[PHASE_6].size).toBe(0);
      expect(ARTIFACTS_PRODUCED_BY[COMPLETE].size).toBe(0);
      expect(ARTIFACTS_PRODUCED_BY[HALTED].size).toBe(0);
    });

    it("PHASE_1_CLEAR_SET contains all 6 artifact names", () => {
      expect(PHASE_1_CLEAR_SET.size).toBe(6);
      expect(isEqual(PHASE_1_CLEAR_SET, ALL_ARTIFACT_NAMES)).toBe(true);
    });

    it("PHASE_3_CLEAR_SET contains exactly tlaSpecPath, tlcResult, tlaReviewPath", () => {
      expect(PHASE_3_CLEAR_SET.size).toBe(3);
      expect(PHASE_3_CLEAR_SET.has("tlaSpecPath")).toBe(true);
      expect(PHASE_3_CLEAR_SET.has("tlcResult")).toBe(true);
      expect(PHASE_3_CLEAR_SET.has("tlaReviewPath")).toBe(true);
    });
  });

  describe("type safety", () => {
    it("HaltReason type covers all expected values", () => {
      const reasons: HaltReason[] = [
        "NONE",
        "USER_HALT",
        "AGENT_FAILURE",
        "RETRY_EXHAUSTED",
        "VALIDATION_EXHAUSTED",
      ];

      expect(reasons).toHaveLength(5);
    });
  });
});
