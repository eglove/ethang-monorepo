import { Effect, Predicate } from "effect";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";

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

const TAG_TO_CODE = {
  DuplicateApplicationError: "DUPLICATE",
  FetchError: "INTERNAL",
  InvalidStatusTransitionError: "INVALID_TRANSITION",
  NotFoundError: "NOT_FOUND",
  ResumeError: "RESUME",
  SaveError: "INTERNAL",
  TokenError: "UNAUTHENTICATED",
  ValidationError: "VALIDATION"
} as const;

type TagKey = keyof typeof TAG_TO_CODE;

const isTagKey = (tag: string): tag is TagKey => {
  return Object.hasOwn(TAG_TO_CODE, tag);
};

type TaggedError = { readonly _tag: string; readonly message: string };

const isTaggedError = (error: unknown): error is TaggedError => {
  return (
    isObject(error) && !isNil(error) && "_tag" in error && "message" in error
  );
};

export const toResult = <A, E, R>(effect: Effect.Effect<A, E, R>) => {
  return Effect.match(effect, {
    onFailure: (error) => {
      if (isTaggedError(error) && isTagKey(error._tag)) {
        return failure(TAG_TO_CODE[error._tag], error);
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
