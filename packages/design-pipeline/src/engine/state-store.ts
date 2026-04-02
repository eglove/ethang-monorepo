import noop from "lodash/noop.js";
import trim from "lodash/trim.js";
import { access, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { TERMINAL_PHASES } from "../state-machine/pipeline-phases.js";
import {
  type PipelineState,
  PipelineStateSchema,
} from "../state-machine/pipeline-state.js";

const STATE_JSON = "state.json";
const STATE_TMP_JSON = "state.tmp.json";
const STATE_LOCK = "state.lock";

export const DEFAULT_STATE_DIRECTORY = path.join(
  import.meta.dirname,
  "..",
  "..",
);

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const isProcessRunning = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

export const createSession = async (
  slug: string,
  stateDirectory: string,
): Promise<{ error: string; pid?: number } | PipelineState> => {
  const lockPath = path.join(stateDirectory, STATE_LOCK);

  const lockExists = await fileExists(lockPath);

  if (lockExists) {
    const lockContent = await readFile(lockPath, "utf8");
    const pid = Number(trim(lockContent));

    if (!Number.isNaN(pid) && isProcessRunning(pid)) {
      return { error: "PIPELINE_LOCKED", pid };
    }
  }

  await writeFile(lockPath, String(process.pid), "utf8");

  const state: PipelineState = {
    accumulatedContext: {},
    haltReason: "NONE",
    phase: "IDLE",
    retries: {
      PHASE_1_QUESTIONER: 0,
      PHASE_3_TLA_WRITER: 0,
    },
    slug,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  };

  await saveSession(state, stateDirectory);

  return state;
};

export const saveSession = async (
  state: unknown,
  stateDirectory: string,
): Promise<{ error: string } | undefined> => {
  const statePath = path.join(stateDirectory, STATE_JSON);
  const temporaryPath = path.join(stateDirectory, STATE_TMP_JSON);
  const lockPath = path.join(stateDirectory, STATE_LOCK);

  const parseResult = PipelineStateSchema.safeParse(state);

  if (!parseResult.success) {
    return { error: `VALIDATION_ERROR: ${String(parseResult.error)}` };
  }

  const validState = parseResult.data;
  const serialized = JSON.stringify(validState, null, 2);

  await writeFile(temporaryPath, serialized, "utf8");
  await unlink(statePath).catch(noop);
  await rename(temporaryPath, statePath);

  if (TERMINAL_PHASES.has(validState.phase)) {
    await unlink(lockPath).catch(noop);
  }

  return undefined;
};

export const loadSession = async (
  _slug: string,
  stateDirectory: string,
): Promise<{ error: string } | PipelineState> => {
  const statePath = path.join(stateDirectory, STATE_JSON);
  const temporaryPath = path.join(stateDirectory, STATE_TMP_JSON);

  const stateExists = await fileExists(statePath);

  if (!stateExists) {
    const temporaryExists = await fileExists(temporaryPath);

    if (temporaryExists) {
      await unlink(temporaryPath).catch(noop);
    }

    return { error: "NO_STATE_FILE: state.json not found" };
  }

  let raw: unknown;

  try {
    raw = JSON.parse(await readFile(statePath, "utf8")) as unknown;
  } catch {
    return { error: "PARSE_ERROR: failed to parse state.json" };
  }

  const parseResult = PipelineStateSchema.safeParse(raw);

  if (!parseResult.success) {
    return { error: `VALIDATION_ERROR: ${String(parseResult.error)}` };
  }

  return parseResult.data;
};
