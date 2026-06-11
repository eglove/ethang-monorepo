/* eslint-disable unicorn/no-process-exit -- build/hook entry point: stdout is the wire protocol and exit codes are the contract */
/**
 * Antigravity PreInvocation hook. On the first invocation of a conversation it
 * injects the workspace's accumulated lessons.md as an ephemeral message so the
 * model starts with prior corrections and proven patterns in context.
 *
 * Contract: JSON on stdin -> JSON on stdout. Output is either `{}` or
 * `{"injectSteps":[{"ephemeralMessage": "..."}]}`. This hook must NEVER break a
 * session: every path prints valid JSON and exits 0, and nothing but the JSON is
 * ever written to stdout.
 */

import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parseHookInput } from "./lessons.utilities.ts";

const SEED_MARKERS = ["*(none yet)*"];

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

/** True when lessons.md holds only the seed skeleton (no real learned content). */
const isSeedOnly = (content: string): boolean => {
  const bulletLines = filter(
    map(split(content, "\n"), (line) => {
      return trim(line);
    }),
    (line) => {
      return startsWith(line, "- ");
    }
  );

  if (0 < bulletLines.length) {
    return false;
  }

  return some(SEED_MARKERS, (marker) => {
    return includes(content, marker);
  });
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
  const invocationNumber = payload?.["invocationNum"];

  if (1 !== invocationNumber) {
    emit({});
  }

  const lessonsPath = path.resolve(
    resolveWorkspaceRoot(payload),
    ".agents",
    "lessons.md"
  );

  if (!existsSync(lessonsPath)) {
    emit({});
  }

  const content = trim(readFileSync(lessonsPath, "utf8"));

  if ("" === content || isSeedOnly(content)) {
    emit({});
  }

  emit({
    injectSteps: [
      {
        ephemeralMessage: `# Learned Lessons (from previous sessions)\n\n${content}`
      }
    ]
  });
} catch {
  emit({});
}
