import type { ErrorKindOrNone } from "./errors.ts";

export const STAGE_STATES = [
  "pending",
  "streaming_input",
  "executing",
  "validating",
  "validation_failed",
  "retrying",
  "git_operating",
  "pair_routing",
  "completed",
  "failed",
  "compensating",
  "compensated",
  "compensation_failed",
] as const;

export type StageState = (typeof STAGE_STATES)[number];

export const RUN_STATES = [
  "idle",
  "running",
  "completed",
  "failed",
  "compensating",
] as const;

export type RunState = (typeof RUN_STATES)[number];

export type StageRecord = {
  artifact: unknown;
  error: ErrorKindOrNone;
  retries: number;
  status: StageState;
  turns: number;
};

export function createEmptyStageRecord(): StageRecord {
  return {
    artifact: undefined,
    error: "none",
    retries: 0,
    status: "pending",
    turns: 0,
  };
}
