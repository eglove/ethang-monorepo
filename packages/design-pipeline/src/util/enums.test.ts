import keys from "lodash/keys.js";
import { describe, expect, it } from "vitest";

import {
  LLM_TERMINAL,
  LlmState,
  RUN_TERMINAL,
  RunState,
  STAGE_TERMINAL,
  StageState,
} from "./enums.ts";

describe("RunState enum", () => {
  it("has exactly 6 members", () => {
    expect(keys(RunState)).toHaveLength(6);
  });

  it("matches TLA+ runState domain", () => {
    expect(RunState.Idle).toBe("idle");
    expect(RunState.Running).toBe("running");
    expect(RunState.Complete).toBe("complete");
    expect(RunState.Error).toBe("error");
    expect(RunState.Aborting).toBe("aborting");
    expect(RunState.Aborted).toBe("aborted");
  });
});

describe("StageState enum", () => {
  it("has exactly 8 members", () => {
    expect(keys(StageState)).toHaveLength(8);
  });

  it("matches TLA+ stageState domain", () => {
    expect(StageState.Idle).toBe("idle");
    expect(StageState.Active).toBe("active");
    expect(StageState.Streaming).toBe("streaming");
    expect(StageState.Complete).toBe("complete");
    expect(StageState.Error).toBe("error");
    expect(StageState.Aborting).toBe("aborting");
    expect(StageState.Aborted).toBe("aborted");
    expect(StageState.Retrying).toBe("retrying");
  });
});

describe("LlmState enum", () => {
  it("has exactly 6 members", () => {
    expect(keys(LlmState)).toHaveLength(6);
  });

  it("matches TLA+ llmState domain", () => {
    expect(LlmState.Idle).toBe("idle");
    expect(LlmState.Requesting).toBe("requesting");
    expect(LlmState.StreamingActive).toBe("streaming-active");
    expect(LlmState.StreamingInterrupted).toBe("streaming-interrupted");
    expect(LlmState.Complete).toBe("complete");
    expect(LlmState.Error).toBe("error");
  });
});

describe("terminal state sets", () => {
  it("RUN_TERMINAL contains complete, error, aborted", () => {
    expect(RUN_TERMINAL).toStrictEqual(
      new Set([RunState.Aborted, RunState.Complete, RunState.Error]),
    );
    expect(RUN_TERMINAL.size).toBe(3);
  });

  it("STAGE_TERMINAL contains complete, error, aborted", () => {
    expect(STAGE_TERMINAL).toStrictEqual(
      new Set([StageState.Aborted, StageState.Complete, StageState.Error]),
    );
    expect(STAGE_TERMINAL.size).toBe(3);
  });

  it("LLM_TERMINAL contains idle, complete, error", () => {
    expect(LLM_TERMINAL).toStrictEqual(
      new Set([LlmState.Complete, LlmState.Error, LlmState.Idle]),
    );
    expect(LLM_TERMINAL.size).toBe(3);
  });
});
