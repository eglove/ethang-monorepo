export enum LlmState {
  Complete = "complete",
  Error = "error",
  Idle = "idle",
  Requesting = "requesting",
  StreamingActive = "streaming-active",
  StreamingInterrupted = "streaming-interrupted",
}

export enum RunState {
  Aborted = "aborted",
  Aborting = "aborting",
  Complete = "complete",
  Error = "error",
  Idle = "idle",
  Running = "running",
}

export enum StageState {
  Aborted = "aborted",
  Aborting = "aborting",
  Active = "active",
  Complete = "complete",
  Error = "error",
  Idle = "idle",
  Retrying = "retrying",
  Streaming = "streaming",
}

export const RUN_TERMINAL = new Set([
  RunState.Aborted,
  RunState.Complete,
  RunState.Error,
]);

export const STAGE_TERMINAL = new Set([
  StageState.Aborted,
  StageState.Complete,
  StageState.Error,
]);

export const LLM_TERMINAL = new Set([
  LlmState.Complete,
  LlmState.Error,
  LlmState.Idle,
]);
