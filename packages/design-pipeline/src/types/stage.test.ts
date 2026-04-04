import { describe, expect, it } from "vitest";

import {
  createEmptyStageRecord,
  RUN_STATES,
  type RunState,
  STAGE_STATES,
  type StageRecord,
  type StageState,
} from "./stage.ts";

describe("Stage States", () => {
  it("defines all 13 stage states (12 TLA+ + compensation_failed)", () => {
    expect(STAGE_STATES).toEqual([
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
    ]);
    expect(STAGE_STATES).toHaveLength(13);
  });

  it("all stage states are unique", () => {
    const unique = new Set(STAGE_STATES);
    expect(unique.size).toBe(13);
  });

  it("stage states are assignable to StageState type", () => {
    const state: StageState = "pending";
    expect(STAGE_STATES).toContain(state);
  });
});

describe("Run States", () => {
  it("contains exactly idle/running/completed/failed/compensating", () => {
    expect(RUN_STATES).toEqual([
      "idle",
      "running",
      "completed",
      "failed",
      "compensating",
    ]);
    expect(RUN_STATES).toHaveLength(5);
  });

  it("run states are assignable to RunState type", () => {
    const state: RunState = "idle";
    expect(RUN_STATES).toContain(state);
  });
});

describe("StageRecord", () => {
  it("can be initialized to empty state", () => {
    const record: StageRecord = createEmptyStageRecord();
    expect(record.status).toBe("pending");
    expect(record.retries).toBe(0);
    expect(record.error).toBe("none");
    expect(record.turns).toBe(0);
    expect(record.artifact).toBeUndefined();
  });

  it("status is a valid StageState", () => {
    const record = createEmptyStageRecord();
    expect(STAGE_STATES).toContain(record.status);
  });
});
