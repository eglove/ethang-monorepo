import keys from "lodash/keys.js";
import { describe, expect, it } from "vitest";

import { STAGES } from "../constants.ts";
import { createRunRecord, type RunRecord } from "./run.ts";

describe("RunRecord", () => {
  it("initializes with state=idle, currentStage=0, all stages pending, checkpoint=0", () => {
    const record = createRunRecord();
    expect(record.state).toBe("idle");
    expect(record.currentStage).toBe(0);
    expect(record.checkpoint).toBe(0);

    for (const stage of STAGES) {
      expect(record.stages[stage].status).toBe("pending");
      expect(record.stages[stage].retries).toBe(0);
      expect(record.stages[stage].error).toBe("none");
      expect(record.stages[stage].turns).toBe(0);
      expect(record.stages[stage].artifact).toBeUndefined();
    }
  });

  it("two RunRecords are independent (instance isolation)", () => {
    const record1 = createRunRecord();
    const record2 = createRunRecord();

    record1.state = "running";
    record1.stages.Questioner.status = "executing";

    expect(record2.state).toBe("idle");
    expect(record2.stages.Questioner.status).toBe("pending");
  });

  it("currentStage and checkpoint accept valid values", () => {
    const record: RunRecord = createRunRecord();
    record.currentStage = 1;
    record.checkpoint = 0;
    expect(record.currentStage).toBe(1);
    expect(record.checkpoint).toBe(0);

    record.currentStage = 7;
    record.checkpoint = 6;
    expect(record.currentStage).toBe(7);
    expect(record.checkpoint).toBe(6);
  });

  it("stages record maps all 7 named stages", () => {
    const record = createRunRecord();
    expect(keys(record.stages)).toHaveLength(7);
    for (const stage of STAGES) {
      expect(record.stages).toHaveProperty(stage);
    }
  });
});
