import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { DuplicateApplicationError } from "./errors/duplicate-application-error.ts";
import { FetchError } from "./errors/fetch-error.ts";
import { InvalidStatusTransitionError } from "./errors/invalid-status-transition-error.ts";
import { NotFoundError } from "./errors/not-found-error.ts";
import { ResumeError } from "./errors/resume-error.ts";
import { SaveError } from "./errors/save-error.ts";
import { TokenError } from "./errors/token-error.ts";
import { ValidationError } from "./errors/validation-error.ts";
import { toResult } from "./rpc-result.ts";

describe("toResult", () => {
  it.each([
    [new ValidationError("v"), "VALIDATION"],
    [new TokenError("t"), "UNAUTHENTICATED"],
    [new NotFoundError("n"), "NOT_FOUND"],
    [new DuplicateApplicationError("d"), "DUPLICATE"],
    [new InvalidStatusTransitionError("i"), "INVALID_TRANSITION"],
    [new ResumeError("r"), "RESUME"],
    [new FetchError("f"), "INTERNAL"],
    [new SaveError("s"), "INTERNAL"],
    [new Error("boom"), "INTERNAL"]
  ] as const)("maps %s to %s", (error, code) => {
    const result = Effect.runSync(toResult(Effect.fail(error)));
    expect(result).toEqual({
      error: { code, message: error.message },
      ok: false
    });
  });

  it("passes through success", () => {
    const result = Effect.runSync(toResult(Effect.succeed(42)));
    expect(result).toEqual({ ok: true, value: 42 });
  });
});
