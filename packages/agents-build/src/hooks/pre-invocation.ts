/* eslint-disable unicorn/no-process-exit -- build/hook entry point: stdout is the wire protocol and exit codes are the contract */
/**
 * Antigravity PreInvocation hook. On the first invocation of a conversation it
 * injects SWEBOK v4 guidelines and the workspace's accumulated lessons.md
 * as ephemeral messages so the model starts with standard rules and prior
 * corrections/proven patterns in context.
 *
 * Contract: JSON on stdin -> JSON on stdout. Output is either `{}` or
 * `{"injectSteps":[{"ephemeralMessage": "..."}]}`. This hook must NEVER break a
 * session: every path prints valid JSON and exits 0, and nothing but the JSON is
 * ever written to stdout.
 */

import isArray from "lodash/isArray.js";
import isNumber from "lodash/isNumber.js";
import isString from "lodash/isString.js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  getPreInvocationResponse,
  parseHookInput
} from "./lessons.utilities.ts";

const emit = (output: Record<string, unknown>): never => {
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
};

const readStdin = async (): Promise<string> => {
  if (process.stdin.isTTY) {
    return "";
  }

  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks).toString("utf8");
};

const resolveWorkspaceRoot = (
  payload: Record<string, unknown> | undefined
): string => {
  const paths = payload?.["workspacePaths"];

  if (isArray(paths) && isString(paths[0]) && "" !== paths[0]) {
    return paths[0];
  }

  // Fallback: this file lives at <root>/packages/agents-build/src/hooks/.
  return path.resolve(import.meta.dirname, "../../../..");
};

try {
  const payload = parseHookInput(await readStdin());
  const rawInvocationNumber = payload?.["invocationNum"];
  const invocationNumber = isNumber(rawInvocationNumber)
    ? rawInvocationNumber
    : undefined;

  if (undefined === invocationNumber || 1 !== invocationNumber) {
    emit({});
  }

  const lessonsPath = path.resolve(
    resolveWorkspaceRoot(payload),
    ".agents",
    "lessons.md"
  );

  let lessonsContent: string | undefined;

  if (existsSync(lessonsPath)) {
    lessonsContent = readFileSync(lessonsPath, "utf8");
  }

  const response = getPreInvocationResponse(invocationNumber, lessonsContent);
  emit(response);
} catch {
  emit({});
}
