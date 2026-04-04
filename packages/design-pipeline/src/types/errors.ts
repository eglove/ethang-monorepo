import type { StageName } from "../constants.ts";

export const ERROR_KINDS = [
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
] as const;

export type ErrorKind = (typeof ERROR_KINDS)[number];

export type ErrorKindOrNone = "none" | ErrorKind;

export type PipelineError = {
  readonly kind: ErrorKind;
  readonly message: string;
  readonly retryCount: number;
  readonly stage: StageName;
};

export function createPipelineError(
  kind: ErrorKind,
  context: {
    message: string;
    retryCount: number;
    stage: StageName;
  },
): PipelineError {
  return {
    kind,
    message: context.message,
    retryCount: context.retryCount,
    stage: context.stage,
  };
}
