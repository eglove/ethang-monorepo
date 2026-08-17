import { Effect, Predicate } from "effect";

import { DuplicateApplicationError } from "./errors/duplicate-application-error.ts";
import { FetchError } from "./errors/fetch-error.ts";
import { InvalidStatusTransitionError } from "./errors/invalid-status-transition-error.ts";
import { NotFoundError } from "./errors/not-found-error.ts";
import { ResumeError } from "./errors/resume-error.ts";
import { SaveError } from "./errors/save-error.ts";
import { TokenError } from "./errors/token-error.ts";
import { ValidationError } from "./errors/validation-error.ts";

export type ErrorCode =
  | "DUPLICATE"
  | "INTERNAL"
  | "INVALID_TRANSITION"
  | "NOT_FOUND"
  | "RESUME"
  | "UNAUTHENTICATED"
  | "VALIDATION";

export type RpcResult<T> =
  | {
      readonly error: { readonly code: ErrorCode; readonly message: string };
      readonly ok: false;
    }
  | { readonly ok: true; readonly value: T };

const failure = (code: ErrorCode, error: { readonly message: string }) => {
  return { error: { code, message: error.message }, ok: false as const };
};

export const toResult = <A, E, R>(effect: Effect.Effect<A, E, R>) => {
  return Effect.match(effect, {
    onFailure: (error) => {
      if (error instanceof ValidationError) {
        return failure("VALIDATION", error);
      }
      if (error instanceof TokenError) {
        return failure("UNAUTHENTICATED", error);
      }
      if (error instanceof NotFoundError) {
        return failure("NOT_FOUND", error);
      }
      if (error instanceof DuplicateApplicationError) {
        return failure("DUPLICATE", error);
      }
      if (error instanceof InvalidStatusTransitionError) {
        return failure("INVALID_TRANSITION", error);
      }
      if (error instanceof ResumeError) {
        return failure("RESUME", error);
      }
      if (error instanceof FetchError || error instanceof SaveError) {
        return failure("INTERNAL", error);
      }
      return failure("INTERNAL", {
        message: Predicate.isError(error) ? error.message : String(error)
      });
    },
    onSuccess: (value) => {
      return { ok: true as const, value };
    }
  });
};
