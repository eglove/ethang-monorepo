import every from "lodash/every.js";
import { describe, expect, it } from "vitest";

import { isValidTransition } from "../state-machine/step-lifecycle.js";
import { TrainerOutputSchema } from "./trainer-output.ts";

const STEP_COMPLETE = "STEP_COMPLETE" as const;
const STEP_FAILED = "STEP_FAILED" as const;
const ALL_DONE = "ALL_DONE" as const;
const TERMINAL_STATES: ReadonlySet<string> = new Set([
  STEP_COMPLETE,
  STEP_FAILED,
]);

type PipelineFixture = {
  implPhase: string;
  pipelineComplete: boolean;
  steps: StepRecord[];
};

type StepRecord = {
  inputContractValid: boolean;
  outputContractValid: boolean;
  state: "STEP_COMPLETE" | "STEP_FAILED";
  tddCycle: number;
  writer: "hono_writer" | "trainer_writer" | "typescript_writer" | "ui_writer";
};

const allStepsTerminal = (steps: StepRecord[]): boolean => {
  return every(steps, (s) => {
    return TERMINAL_STATES.has(s.state);
  });
};

const pipelineCanComplete = (fixture: PipelineFixture): boolean => {
  return allStepsTerminal(fixture.steps) && fixture.implPhase === ALL_DONE;
};

const trainerContractRequired = (steps: StepRecord[]): boolean => {
  return every(steps, (s) => {
    if ("trainer_writer" === s.writer && s.state === STEP_COMPLETE) {
      return s.inputContractValid && s.outputContractValid;
    }

    return true;
  });
};

const completionRequiresTdd = (steps: StepRecord[]): boolean => {
  return every(steps, (s) => {
    if (s.state === STEP_COMPLETE) {
      return 1 <= s.tddCycle;
    }

    return true;
  });
};

describe("pipeline completion verification", () => {
  it("allows pipelineComplete when all steps terminal and implPhase is ALL_DONE", () => {
    const fixture: PipelineFixture = {
      implPhase: ALL_DONE,
      pipelineComplete: false,
      steps: [
        {
          inputContractValid: false,
          outputContractValid: false,
          state: STEP_COMPLETE,
          tddCycle: 1,
          writer: "typescript_writer",
        },
        {
          inputContractValid: false,
          outputContractValid: false,
          state: STEP_COMPLETE,
          tddCycle: 2,
          writer: "hono_writer",
        },
        {
          inputContractValid: true,
          outputContractValid: true,
          state: STEP_COMPLETE,
          tddCycle: 1,
          writer: "trainer_writer",
        },
      ],
    };

    expect(pipelineCanComplete(fixture)).toBe(true);
  });

  it("allows pipelineComplete when some steps are STEP_FAILED (still terminal)", () => {
    const fixture: PipelineFixture = {
      implPhase: ALL_DONE,
      pipelineComplete: false,
      steps: [
        {
          inputContractValid: false,
          outputContractValid: false,
          state: STEP_COMPLETE,
          tddCycle: 1,
          writer: "typescript_writer",
        },
        {
          inputContractValid: false,
          outputContractValid: false,
          state: STEP_FAILED,
          tddCycle: 0,
          writer: "hono_writer",
        },
        {
          inputContractValid: true,
          outputContractValid: true,
          state: STEP_COMPLETE,
          tddCycle: 1,
          writer: "trainer_writer",
        },
      ],
    };

    expect(pipelineCanComplete(fixture)).toBe(true);
  });

  it("blocks pipelineComplete when implPhase is not ALL_DONE", () => {
    const fixture: PipelineFixture = {
      implPhase: "PHASE_C",
      pipelineComplete: false,
      steps: [
        {
          inputContractValid: false,
          outputContractValid: false,
          state: STEP_COMPLETE,
          tddCycle: 1,
          writer: "typescript_writer",
        },
      ],
    };

    expect(pipelineCanComplete(fixture)).toBe(false);
  });

  it("blocks pipelineComplete when a step is still active", () => {
    const fixture: PipelineFixture = {
      implPhase: ALL_DONE,
      pipelineComplete: false,
      steps: [
        {
          inputContractValid: false,
          outputContractValid: false,
          state: STEP_COMPLETE,
          tddCycle: 1,
          writer: "typescript_writer",
        },
        {
          inputContractValid: false,
          outputContractValid: false,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- intentional invalid state for testing
          state: "RED" as "STEP_COMPLETE",
          tddCycle: 1,
          writer: "hono_writer",
        },
      ],
    };

    expect(pipelineCanComplete(fixture)).toBe(false);
  });

  it("TrainerContractRequired passes when trainer step has both contracts valid", () => {
    const steps: StepRecord[] = [
      {
        inputContractValid: true,
        outputContractValid: true,
        state: STEP_COMPLETE,
        tddCycle: 1,
        writer: "trainer_writer",
      },
    ];

    expect(trainerContractRequired(steps)).toBe(true);
  });

  it("TrainerContractRequired fails when trainer step missing output contract", () => {
    const steps: StepRecord[] = [
      {
        inputContractValid: true,
        outputContractValid: false,
        state: STEP_COMPLETE,
        tddCycle: 1,
        writer: "trainer_writer",
      },
    ];

    expect(trainerContractRequired(steps)).toBe(false);
  });

  it("CompletionRequiresTDD rejects step with tddCycle=0", () => {
    const steps: StepRecord[] = [
      {
        inputContractValid: false,
        outputContractValid: false,
        state: STEP_COMPLETE,
        tddCycle: 0,
        writer: "typescript_writer",
      },
    ];

    expect(completionRequiresTdd(steps)).toBe(false);
  });

  it("validates trainer output against TrainerOutputSchema for completed trainer step", () => {
    const trainerOutput = {
      artifactType: "skill",
      frontmatter: { description: "A test skill", name: "test-skill" },
      handoff: { passes: "Report", passesTo: "reviewer" },
      manifest: [
        { action: "create", filePath: ".claude/skills/test/SKILL.md" },
      ],
      noTbdPlaceholders: true,
      sections: [{ heading: "## When to Use", required: true }],
    };

    expect(() => {
      TrainerOutputSchema.parse(trainerOutput);
    }).not.toThrow();
  });

  it("step lifecycle transitions lead to terminal states", () => {
    const context = {
      contractRetries: 0,
      maxContractRetries: 3,
      maxTDDCycles: 5,
      tddCycle: 0,
    };

    expect(isValidTransition("UNASSIGNED", "ASSIGNED", context)).toBe(true);
    expect(isValidTransition("ASSIGNED", "HANDSHAKE", context)).toBe(true);
    expect(isValidTransition("REFACTOR", "STEP_COMPLETE", context)).toBe(true);
    expect(isValidTransition("STEP_COMPLETE", "ASSIGNED", context)).toBe(false);
  });
});
