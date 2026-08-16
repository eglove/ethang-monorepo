import { describe, expect, it } from "vitest";

import { DuplicateApplicationError as DuplicateAppError } from "./duplicate-application-error.ts";
import { FetchError } from "./fetch-error.ts";
import { InvalidStatusTransitionError } from "./invalid-status-transition-error.ts";
import { NotFoundError } from "./not-found-error.ts";
import { ResumeError } from "./resume-error.ts";
import { SaveError } from "./save-error.ts";
import { TokenError } from "./token-error.ts";
import { ValidationError } from "./validation-error.ts";

const CASES = [
  [ValidationError, "ValidationError"],
  [TokenError, "TokenError"],
  [ResumeError, "ResumeError"],
  [NotFoundError, "NotFoundError"],
  [DuplicateAppError, "DuplicateApplicationError"],
  [InvalidStatusTransitionError, "InvalidStatusTransitionError"],
  [FetchError, "FetchError"],
  [SaveError, "SaveError"]
] as const;

describe("errors", () => {
  it.each(CASES)("%s has the right _tag and message", (ErrorClass, tag) => {
    const error = new ErrorClass("boom");
    expect(error._tag).toBe(tag);
    expect(error.message).toBe("boom");
  });
});
