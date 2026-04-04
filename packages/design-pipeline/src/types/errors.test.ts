import { describe, expect, it } from "vitest";

import {
  createPipelineError,
  ERROR_KINDS,
  type ErrorKind,
  type PipelineError,
} from "./errors.ts";

describe("Error Kinds", () => {
  it("defines all 15 error kinds", () => {
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
      "signoff_exhausted",
      "turn_cap_exceeded",
      "lint_exhausted",
      "questioner_session_failed",
      "questioner_runner_missing",
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

  it("new error kinds can be constructed via createPipelineError", () => {
    const newKinds = [
      "signoff_exhausted",
      "turn_cap_exceeded",
      "lint_exhausted",
    ] as const;

    for (const kind of newKinds) {
      const error = createPipelineError(kind, {
        message: `Test ${kind}`,
        retryCount: 1,
        stage: "Questioner",
      });
      expect(error.kind).toBe(kind);
      expect(error.message).toBe(`Test ${kind}`);
      expect(error.retryCount).toBe(1);
    }
  });

  it("ErrorKind type accepts the new strings", () => {
    const signoff: ErrorKind = "signoff_exhausted";
    const turnCap: ErrorKind = "turn_cap_exceeded";
    const lint: ErrorKind = "lint_exhausted";

    expect(ERROR_KINDS).toContain(signoff);
    expect(ERROR_KINDS).toContain(turnCap);
    expect(ERROR_KINDS).toContain(lint);
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
