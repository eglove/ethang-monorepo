import isError from "lodash/isError.js";

export enum ErrorKind {
  AbortError = "AbortError",
  FileSystemError = "FileSystemError",
  GitError = "GitError",
  InfrastructureError = "InfrastructureError",
  LlmError = "LlmError",
  NotImplemented = "NotImplemented",
  RetryExhausted = "RetryExhausted",
  TimeoutError = "TimeoutError",
  ValidationError = "ValidationError",
}

export type ErrorResult = { error: ErrorKind; message: string; ok: false };
export type OkResult<T> = { ok: true; value: T };
export type Result<T> = ErrorResult | OkResult<T>;

export function ok(): OkResult<void>;
export function ok<T>(value: T): OkResult<T>;
export function ok<T>(value?: T): OkResult<T | void> {
  return { ok: true, value } as OkResult<T | void>;
}

export const resultError = (error: ErrorKind, message: string): ErrorResult => {
  return { error, message, ok: false };
};

export const isOk = <T>(result: Result<T>): result is OkResult<T> => {
  return result.ok;
};

export const isResultError = <T>(result: Result<T>): result is ErrorResult => {
  return !result.ok;
};

export const fromAttempt = <T>(value: Error | T): Result<T> => {
  if (isError(value)) {
    return resultError(ErrorKind.InfrastructureError, value.message);
  }

  return ok(value);
};

export const fromAttemptAsync = async <T>(
  promise: Promise<T>,
): Promise<Result<T>> => {
  try {
    const value = await promise;
    return ok(value);
  } catch (error: unknown) {
    const message = isError(error) ? error.message : String(error);
    return resultError(ErrorKind.InfrastructureError, message);
  }
};
