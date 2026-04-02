import { describe, expect, it } from "vitest";

import {
  isValidTransition,
  type StepState,
  type TransitionContext,
} from "./step-lifecycle.js";

// Repeated state names extracted to constants
const UNASSIGNED: StepState = "UNASSIGNED";
const ASSIGNED: StepState = "ASSIGNED";
const HANDSHAKE: StepState = "HANDSHAKE";
const RED: StepState = "RED";
const CONTRACT_VALIDATE: StepState = "CONTRACT_VALIDATE";
const GREEN: StepState = "GREEN";
const REFACTOR: StepState = "REFACTOR";
const STEP_COMPLETE: StepState = "STEP_COMPLETE";
const STEP_FAILED: StepState = "STEP_FAILED";

const defaultContext: TransitionContext = {
  contractRetries: 0,
  maxContractRetries: 3,
  maxTDDCycles: 5,
  tddCycle: 0,
};

describe("step lifecycle state machine", () => {
  describe("valid transitions", () => {
    it("should allow UNASSIGNED -> ASSIGNED (AssignWriter)", () => {
      expect(isValidTransition(UNASSIGNED, ASSIGNED, defaultContext)).toBe(
        true,
      );
    });

    it("should allow ASSIGNED -> HANDSHAKE (BeginHandshake)", () => {
      expect(isValidTransition(ASSIGNED, HANDSHAKE, defaultContext)).toBe(true);
    });

    it("should allow HANDSHAKE -> RED when tddCycle < maxTDDCycles (WriteFailingTest)", () => {
      const context: TransitionContext = {
        ...defaultContext,
        maxTDDCycles: 5,
        tddCycle: 2,
      };

      expect(isValidTransition(HANDSHAKE, RED, context)).toBe(true);
    });

    it("should allow HANDSHAKE -> STEP_FAILED when tddCycle >= maxTDDCycles (TDDExhausted)", () => {
      const context: TransitionContext = {
        ...defaultContext,
        maxTDDCycles: 5,
        tddCycle: 5,
      };

      expect(isValidTransition(HANDSHAKE, STEP_FAILED, context)).toBe(true);
    });

    it("should allow RED -> CONTRACT_VALIDATE (RunContractValidation)", () => {
      expect(isValidTransition(RED, CONTRACT_VALIDATE, defaultContext)).toBe(
        true,
      );
    });

    it("should allow CONTRACT_VALIDATE -> GREEN (ContractPasses)", () => {
      expect(isValidTransition(CONTRACT_VALIDATE, GREEN, defaultContext)).toBe(
        true,
      );
    });

    it("should allow CONTRACT_VALIDATE -> HANDSHAKE when contractRetries < maxContractRetries (ContractFails)", () => {
      const context: TransitionContext = {
        ...defaultContext,
        contractRetries: 1,
        maxContractRetries: 3,
      };

      expect(isValidTransition(CONTRACT_VALIDATE, HANDSHAKE, context)).toBe(
        true,
      );
    });

    it("should allow CONTRACT_VALIDATE -> STEP_FAILED when contractRetries >= maxContractRetries (ContractFailsExhausted)", () => {
      const context: TransitionContext = {
        ...defaultContext,
        contractRetries: 3,
        maxContractRetries: 3,
      };

      expect(isValidTransition(CONTRACT_VALIDATE, STEP_FAILED, context)).toBe(
        true,
      );
    });

    it("should allow GREEN -> REFACTOR (BeginRefactor)", () => {
      expect(isValidTransition(GREEN, REFACTOR, defaultContext)).toBe(true);
    });

    it("should allow REFACTOR -> STEP_COMPLETE (CompleteStep)", () => {
      expect(isValidTransition(REFACTOR, STEP_COMPLETE, defaultContext)).toBe(
        true,
      );
    });

    it("should allow REFACTOR -> HANDSHAKE when tddCycle < maxTDDCycles (AnotherCycle)", () => {
      const context: TransitionContext = {
        ...defaultContext,
        maxTDDCycles: 5,
        tddCycle: 3,
      };

      expect(isValidTransition(REFACTOR, HANDSHAKE, context)).toBe(true);
    });
  });

  describe("invalid transitions", () => {
    it("should reject UNASSIGNED -> RED (cannot skip ASSIGNED and HANDSHAKE)", () => {
      expect(isValidTransition(UNASSIGNED, RED, defaultContext)).toBe(false);
    });

    it("should reject GREEN -> STEP_COMPLETE (must go through REFACTOR)", () => {
      expect(isValidTransition(GREEN, STEP_COMPLETE, defaultContext)).toBe(
        false,
      );
    });

    it("should reject STEP_COMPLETE -> any state (terminal state)", () => {
      const allStates: StepState[] = [
        UNASSIGNED,
        ASSIGNED,
        HANDSHAKE,
        RED,
        CONTRACT_VALIDATE,
        GREEN,
        REFACTOR,
        STEP_COMPLETE,
        STEP_FAILED,
      ];

      for (const target of allStates) {
        expect(isValidTransition(STEP_COMPLETE, target, defaultContext)).toBe(
          false,
        );
      }
    });

    it("should reject STEP_FAILED -> any state (terminal state)", () => {
      const allStates: StepState[] = [
        UNASSIGNED,
        ASSIGNED,
        HANDSHAKE,
        RED,
        CONTRACT_VALIDATE,
        GREEN,
        REFACTOR,
        STEP_COMPLETE,
        STEP_FAILED,
      ];

      for (const target of allStates) {
        expect(isValidTransition(STEP_FAILED, target, defaultContext)).toBe(
          false,
        );
      }
    });
  });
});
