import { describe, expect, it } from "vitest";

import { createEmptyStageRecord } from "../types/stage.ts";
import { computeRetryResult } from "./retry.ts";

describe("Retry Coordinator", () => {
  it("first retry attempt returns retrying state with retries=1", () => {
    const stage = createEmptyStageRecord();
    stage.status = "validation_failed";
    stage.retries = 0;
    const result = computeRetryResult(stage, "zod_validation", {
      maxRetries: 3,
      retryBaseDelayMs: 1000,
    });
    expect(result.status).toBe("retrying");
    expect(result.retries).toBe(1);
    expect(result.error).toBe("zod_validation");
  });

  it("retry at cap returns failed with retry_exhausted", () => {
    const stage = createEmptyStageRecord();
    stage.status = "validation_failed";
    stage.retries = 3;
    const result = computeRetryResult(stage, "zod_validation", {
      maxRetries: 3,
      retryBaseDelayMs: 1000,
    });
    expect(result.status).toBe("failed");
    expect(result.error).toBe("retry_exhausted");
  });

  it("backoff delay increases with each retry", () => {
    const stage1 = createEmptyStageRecord();
    stage1.retries = 0;
    const result1 = computeRetryResult(stage1, "claude_api_timeout", {
      maxRetries: 5,
      retryBaseDelayMs: 1000,
    });

    const stage2 = createEmptyStageRecord();
    stage2.retries = 1;
    const result2 = computeRetryResult(stage2, "claude_api_timeout", {
      maxRetries: 5,
      retryBaseDelayMs: 1000,
    });

    const stage3 = createEmptyStageRecord();
    stage3.retries = 2;
    const result3 = computeRetryResult(stage3, "claude_api_timeout", {
      maxRetries: 5,
      retryBaseDelayMs: 1000,
    });

    expect(result1.delayMs).toBeLessThan(result2.delayMs ?? 0);
    expect(result2.delayMs).toBeLessThan(result3.delayMs ?? 0);
  });

  it("different error kinds all flow through the same mechanism", () => {
    const kinds = [
      "claude_api_timeout",
      "zod_validation",
      "git_failure",
    ] as const;
    for (const kind of kinds) {
      const stage = createEmptyStageRecord();
      stage.retries = 0;
      const result = computeRetryResult(stage, kind, {
        maxRetries: 3,
        retryBaseDelayMs: 1000,
      });
      expect(result.status).toBe("retrying");
      expect(result.retries).toBe(1);
    }
  });

  it("git failures use the retry path (Gap 1)", () => {
    const stage = createEmptyStageRecord();
    stage.retries = 0;
    const result = computeRetryResult(stage, "git_failure", {
      maxRetries: 3,
      retryBaseDelayMs: 1000,
    });
    expect(result.status).toBe("retrying");
    expect(result.error).toBe("git_failure");
  });

  it("config with maxRetries=1 allows exactly one retry", () => {
    const stage0 = createEmptyStageRecord();
    stage0.retries = 0;
    const result0 = computeRetryResult(stage0, "zod_validation", {
      maxRetries: 1,
      retryBaseDelayMs: 1000,
    });
    expect(result0.status).toBe("retrying");
    expect(result0.retries).toBe(1);

    const stage1 = createEmptyStageRecord();
    stage1.retries = 1;
    const result1 = computeRetryResult(stage1, "zod_validation", {
      maxRetries: 1,
      retryBaseDelayMs: 1000,
    });
    expect(result1.status).toBe("failed");
    expect(result1.error).toBe("retry_exhausted");
  });
});
