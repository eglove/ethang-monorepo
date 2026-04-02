import { describe, expect, it } from "vitest";

import {
  ACTIVE_PHASES,
  advancePipeline,
  ALL_ARTIFACT_NAMES,
  ARTIFACTS_PRODUCED_BY,
  CodeWriterEntrySchema,
  CodeWriterInputSchema,
  CodeWriterListSchema,
  CodeWriterOutputSchema,
  // Engine
  createSession,
  DebateModeratorInputSchema,
  DebateModeratorOutputSchema,
  decisionGuideRowSchema,
  DEFAULT_STATE_DIRECTORY,
  dispatchTargetListSchema,
  // Contracts — Shared
  FrontmatterSchema,
  getPipelineStatus,
  haltPipeline,
  HandoffContractSchema,
  HonoWriterInputSchema,
  HonoWriterOutputSchema,
  isValidPipelineTransition,
  // State Machine
  isValidTransition,
  loadSession,
  MAX_PIPELINE_RETRIES,
  MAX_VALIDATION_ATTEMPTS,
  NON_TERMINAL_PHASES,
  parseAndExecute,
  PHASE_1_CLEAR_SET,
  PHASE_3_CLEAR_SET,
  PHASE_ORD,
  PipelineStateSchema,
  PlaywrightWriterInputSchema,
  PlaywrightWriterOutputSchema,
  RETRYABLE_PHASES,
  retryPipeline,
  saveSession,
  SectionSchema,
  startPipeline,
  TERMINAL_PHASES,
  TestWriterOutputSchema,
  TlaWriterInputSchema,
  TlaWriterOutputSchema,
  // Contracts — Agents
  TrainerInputSchema,
  TrainerOutputSchema,
  transitionPipeline,
  // Writer contracts
  TypescriptWriterInputSchema,
  TypescriptWriterOutputSchema,
  UiWriterInputSchema,
  UiWriterOutputSchema,
  validateCodeWriterOutput,
  VALIDATED_PHASES,
  validateDebateOutput,
  validateTestWriterOutput,
  validateTlaWriterOutput,
  ValidationResultSchema,
  VitestWriterInputSchema,
  VitestWriterOutputSchema,
} from "./index.ts";

describe("package exports", () => {
  it("exports all shared contract schemas", () => {
    expect(FrontmatterSchema).toBeDefined();
    expect(SectionSchema).toBeDefined();
    expect(HandoffContractSchema).toBeDefined();
    expect(CodeWriterInputSchema).toBeDefined();
    expect(CodeWriterOutputSchema).toBeDefined();
    expect(TestWriterOutputSchema).toBeDefined();
    expect(ValidationResultSchema).toBeDefined();
  });

  it("exports all agent contract schemas", () => {
    expect(TrainerInputSchema).toBeDefined();
    expect(TrainerOutputSchema).toBeDefined();
    expect(dispatchTargetListSchema).toBeDefined();
    expect(decisionGuideRowSchema).toBeDefined();
    expect(CodeWriterEntrySchema).toBeDefined();
    expect(CodeWriterListSchema).toBeDefined();
    expect(DebateModeratorInputSchema).toBeDefined();
    expect(DebateModeratorOutputSchema).toBeDefined();
    expect(TlaWriterInputSchema).toBeDefined();
    expect(TlaWriterOutputSchema).toBeDefined();
  });

  it("exports all writer contract schemas", () => {
    expect(TypescriptWriterInputSchema).toBeDefined();
    expect(TypescriptWriterOutputSchema).toBeDefined();
    expect(HonoWriterInputSchema).toBeDefined();
    expect(HonoWriterOutputSchema).toBeDefined();
    expect(UiWriterInputSchema).toBeDefined();
    expect(UiWriterOutputSchema).toBeDefined();
    expect(VitestWriterInputSchema).toBeDefined();
    expect(VitestWriterOutputSchema).toBeDefined();
    expect(PlaywrightWriterInputSchema).toBeDefined();
    expect(PlaywrightWriterOutputSchema).toBeDefined();
  });

  it("exports all state machine functions and constants", () => {
    expect(isValidTransition).toBeDefined();
    expect(TERMINAL_PHASES).toBeDefined();
    expect(NON_TERMINAL_PHASES).toBeDefined();
    expect(ACTIVE_PHASES).toBeDefined();
    expect(VALIDATED_PHASES).toBeDefined();
    expect(RETRYABLE_PHASES).toBeDefined();
    expect(MAX_PIPELINE_RETRIES).toBeDefined();
    expect(MAX_VALIDATION_ATTEMPTS).toBeDefined();
    expect(PHASE_ORD).toBeDefined();
    expect(ARTIFACTS_PRODUCED_BY).toBeDefined();
    expect(PHASE_1_CLEAR_SET).toBeDefined();
    expect(PHASE_3_CLEAR_SET).toBeDefined();
    expect(ALL_ARTIFACT_NAMES).toBeDefined();
    expect(PipelineStateSchema).toBeDefined();
    expect(isValidPipelineTransition).toBeDefined();
    expect(transitionPipeline).toBeDefined();
  });

  it("exports all engine functions", () => {
    expect(createSession).toBeDefined();
    expect(loadSession).toBeDefined();
    expect(saveSession).toBeDefined();
    expect(DEFAULT_STATE_DIRECTORY).toBeDefined();
    expect(validateDebateOutput).toBeDefined();
    expect(validateTlaWriterOutput).toBeDefined();
    expect(validateCodeWriterOutput).toBeDefined();
    expect(validateTestWriterOutput).toBeDefined();
    expect(startPipeline).toBeDefined();
    expect(advancePipeline).toBeDefined();
    expect(getPipelineStatus).toBeDefined();
    expect(retryPipeline).toBeDefined();
    expect(haltPipeline).toBeDefined();
    expect(parseAndExecute).toBeDefined();
  });
});
