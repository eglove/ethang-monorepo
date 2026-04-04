import { describe, expect, it } from "vitest";

import {
  createPipelineError,
  ERROR_KINDS,
  type PipelineError,
} from "./errors.ts";

describe("Error Kinds", () => {
  it("defines all 10 error kinds", () => {
    expect(ERROR_KINDS).toEqual([
      "claude_api_timeout",
      "claude_api_rate_limit",
      "zod_validation",
      "git_failure",
      "user_abandon",
      "retry_exhausted",
      "stream_limit_exceeded",
      "git_retry_exhausted",
      "compensation_failed",
      "pair_routing_api_failed",
    ]);
  });

  it("each error kind can be constructed", () => {
    for (const kind of ERROR_KINDS) {
      const error = createPipelineError(kind, {
        message: `Test ${kind}`,
        retryCount: 0,
        stage: "Questioner",
      });
      expect(error.kind).toBe(kind);
      expect(error.message).toBe(`Test ${kind}`);
      expect(error.stage).toBe("Questioner");
      expect(error.retryCount).toBe(0);
    }
  });

  it("discriminant field narrows correctly", () => {
    const error = createPipelineError("claude_api_timeout", {
      message: "timeout",
      retryCount: 1,
      stage: "DebateModerator",
    });

    if ("claude_api_timeout" === error.kind) {
      expect(error.retryCount).toBe(1);
    } else {
      expect.unreachable("should have matched claude_api_timeout");
    }
  });

  it("none is not a valid error kind for PipelineError construction", () => {
    expect(ERROR_KINDS).not.toContain("none");
  });

  it("error carries required contextual fields", () => {
    const error: PipelineError = createPipelineError("zod_validation", {
      message: "Invalid field",
      retryCount: 2,
      stage: "TlaWriter",
    });

    expect(error).toHaveProperty("kind");
    expect(error).toHaveProperty("message");
    expect(error).toHaveProperty("stage");
    expect(error).toHaveProperty("retryCount");
  });
});
