import { describe, expect, it, vi } from "vitest";

// Mock STAGES to have only 2 entries so advanceStage from stage 2 goes to stage 3
// which is beyond the array, triggering the nextStageName guard
vi.mock("../constants.ts", async (importOriginal) => {
  const original =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    await importOriginal<typeof import("../constants.ts")>();
  return {
    ...original,
    // Only 2 stages so stage index 3 (STAGES[2]) is undefined
    STAGES: ["Questioner", "DebateModerator"] as const,
  };
});

import { createRunRecord } from "../types/run.ts";
import { advanceStage } from "./transitions.ts";

describe("advanceStage — nextStageName guard (transitions line 74)", () => {
  it("returns error when next stage index maps to undefined in STAGES", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "completed";
    const result = advanceStage(run);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("Invalid stage index");
    }
  });
});
