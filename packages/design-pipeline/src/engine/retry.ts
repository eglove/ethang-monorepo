import type { ErrorKindOrNone } from "../types/errors.ts";
import type { StageRecord, StageState } from "../types/stage.ts";

type RetryConfig = {
  maxRetries: number;
  retryBaseDelayMs: number;
};

type RetryResult = {
  delayMs: number | undefined;
  error: ErrorKindOrNone;
  retries: number;
  status: StageState;
};

export function computeRetryResult(
  stage: StageRecord,
  errorKind: ErrorKindOrNone,
  config: RetryConfig,
): RetryResult {
  if (stage.retries >= config.maxRetries) {
    return {
      delayMs: undefined,
      error: "retry_exhausted",
      retries: stage.retries,
      status: "failed",
    };
  }

  const nextRetries = stage.retries + 1;
  const delayMs = config.retryBaseDelayMs * 2 ** stage.retries;

  return {
    delayMs,
    error: errorKind,
    retries: nextRetries,
    status: "retrying",
  };
}
