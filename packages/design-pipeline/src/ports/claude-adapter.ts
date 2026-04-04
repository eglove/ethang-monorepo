import type { ErrorKind } from "../types/errors.ts";

export type ClaudeAdapter = {
  executePrompt: (prompt: string) => Promise<ClaudeResult>;
  routePairMessage: (message: string) => Promise<ClaudeResult>;
  streamPrompt: (prompt: string) => Promise<ClaudeResult>;
};

export type ClaudeResult =
  | { data: unknown; ok: true }
  | { errorKind: ErrorKind; message: string; ok: false };

export function isClaudeError(
  result: ClaudeResult,
): result is { errorKind: ErrorKind; message: string; ok: false } {
  return !result.ok;
}

export function isClaudeSuccess(
  result: ClaudeResult,
): result is { data: unknown; ok: true } {
  return result.ok;
}
