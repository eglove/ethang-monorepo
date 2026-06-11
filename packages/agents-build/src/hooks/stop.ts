/* eslint-disable unicorn/no-process-exit -- build/hook entry point: stdout is the wire protocol and exit codes are the contract */
/**
 * Antigravity Stop hook (thin launcher). Stop fires at the end of EVERY
 * execution loop, not once per session, so dedupe is load-bearing: we only
 * dispatch an extraction when the transcript has grown past the offset already
 * processed AND the rate-limit window has elapsed (see shouldDispatch).
 *
 * When a dispatch is warranted it spawns lessons-worker.ts DETACHED and returns
 * immediately. Returning `{}` allows the stop; we never block. Every path prints
 * `{}` and exits 0 — the hook must never break a session.
 */

import isArray from "lodash/isArray.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  DEFAULT_MIN_INTERVAL_MS,
  type DispatchState,
  parseHookInput,
  shouldDispatch
} from "./lessons.utilities.ts";

const PACKAGE_ROOT = path.resolve(import.meta.dirname, "../..");
const STATE_PATH = path.resolve(PACKAGE_ROOT, ".lessons-state.json");
const WORKER_PATH = path.resolve(import.meta.dirname, "lessons-worker.ts");

const allow = (): never => {
  process.stdout.write("{}");
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

const isDispatchState = (value: unknown): value is DispatchState => {
  return null !== value && isObject(value) && !isArray(value);
};

const loadState = (): DispatchState => {
  try {
    if (!existsSync(STATE_PATH)) {
      return {};
    }

    const parsed: unknown = JSON.parse(readFileSync(STATE_PATH, "utf8"));

    if (!isDispatchState(parsed)) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
};

const resolveWorkspaceRoot = (payload: Record<string, unknown>): string => {
  const paths = payload["workspacePaths"];

  if (isArray(paths) && isString(paths[0]) && "" !== paths[0]) {
    return paths[0];
  }

  return path.resolve(PACKAGE_ROOT, "../..");
};

try {
  const payload = parseHookInput(await readStdin());

  if (true !== payload?.["fullyIdle"]) {
    allow();
  }

  const rawId = payload?.["conversationId"];
  const conversationId = isString(rawId) ? rawId : "";
  const rawPath = payload?.["transcriptPath"];
  const transcriptPath = isString(rawPath) ? rawPath : "";

  if (
    "" === conversationId ||
    "" === transcriptPath ||
    !existsSync(transcriptPath)
  ) {
    allow();
  }

  const transcriptSize = statSync(transcriptPath).size;
  const state = loadState();
  const now = Date.now();

  if (
    !shouldDispatch(
      state,
      conversationId,
      transcriptSize,
      now,
      DEFAULT_MIN_INTERVAL_MS
    )
  ) {
    allow();
  }

  const workspaceRoot = resolveWorkspaceRoot(payload ?? {});

  /* eslint-disable sonar/no-os-command-from-path -- bun is a trusted runtime installed on PATH */
  const child = spawn(
    "bun",
    [WORKER_PATH, transcriptPath, conversationId, workspaceRoot],
    {
      detached: true,
      shell: true,
      stdio: "ignore",
      windowsHide: true
    }
  );
  /* eslint-enable sonar/no-os-command-from-path */

  child.unref();

  // Optimistic update: record the offset we just dispatched on so subsequent
  // Stop loops in this same window dedupe even though the worker is still running.
  state[conversationId] = { lastDispatch: now, offset: transcriptSize };
  writeFileSync(STATE_PATH, JSON.stringify(state), "utf8");

  allow();
} catch {
  allow();
}
