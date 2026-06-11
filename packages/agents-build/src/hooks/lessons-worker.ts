/* eslint-disable unicorn/no-process-exit -- build/hook entry point: stdout is the wire protocol and exit codes are the contract */
/**
 * Detached worker for the Stop hook. stop.ts spawns this with `detached: true`
 * + `.unref()` and returns immediately, so the slow extraction call and the file
 * writes survive the execution loop ending — Antigravity no longer waits on (or
 * reaps) this process.
 *
 * argv: <transcriptPath> <conversationId> <workspaceRoot>.
 *
 * Dispatch strategy:
 *   1. Prefer `agentapi` (documented as injected into the sidecar PATH; may be
 *      absent in hook context). It owns the whole edit via buildExtractionPrompt.
 *   2. Fallback: drive the `claude` CLI for a structured lessons delta, then
 *      apply it here (applyDelta + append artifact improvements).
 *
 * Reads only the NEW slice of the transcript since the offset stop.ts recorded.
 * ALWAYS exits 0; never throws out of the top level.
 */

import isArray from "lodash/isArray.js";
import isError from "lodash/isError.js";
import isObject from "lodash/isObject.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { PLUGINS } from "../content/plugins/index.ts";
import { SHARED_RULES } from "../content/rules/shared.ts";
import {
  applyDelta,
  buildExtractionPrompt,
  detectInvokedArtifacts,
  type DispatchState,
  isDeltaEmpty,
  type LessonsDelta,
  parseClaudeEnvelope,
  parseTranscriptSlice
} from "./lessons.utilities.ts";

const PACKAGE_ROOT = path.resolve(import.meta.dirname, "../..");
const STATE_PATH = path.resolve(PACKAGE_ROOT, ".lessons-state.json");
const LOG_PATH = path.resolve(PACKAGE_ROOT, "lessons.log");

/**
 * Skill + rule names this workspace ships, derived from the plugin
 * definitions so the list can never drift from the generated artifacts.
 * Used to detect which artifacts a session exercised so the extraction can
 * suggest improvements to them.
 */
export const CANDIDATE_ARTIFACTS: readonly string[] = [
  ...new Set([
    ...PLUGINS.flatMap((plugin) => {
      return [
        ...map(plugin.skills, (skill) => {
          return skill.name;
        }),
        ...map(plugin.rules ?? [], (rule) => {
          return rule.filename;
        })
      ];
    }),
    ...map(SHARED_RULES, (rule) => {
      return rule.filename;
    })
  ])
];

/** Hard ceiling enforced after the agentapi path as a safety net. */
const LESSONS_HARD_LIMIT = 12_000;

const LESSONS_SCHEMA = {
  properties: {
    corrections: {
      properties: {
        add: { items: { type: "string" }, type: "array" },
        modify: {
          items: {
            properties: { new: { type: "string" }, old: { type: "string" } },
            required: ["old", "new"],
            type: "object"
          },
          type: "array"
        },
        remove: { items: { type: "string" }, type: "array" }
      },
      type: "object"
    },
    patterns: {
      properties: {
        add: { items: { type: "string" }, type: "array" },
        modify: {
          items: {
            properties: { new: { type: "string" }, old: { type: "string" } },
            required: ["old", "new"],
            type: "object"
          },
          type: "array"
        },
        remove: { items: { type: "string" }, type: "array" }
      },
      type: "object"
    }
  },
  type: "object"
};

const COMBINED_SCHEMA = {
  properties: {
    artifact_improvements: { type: "string" },
    lessons: LESSONS_SCHEMA
  },
  type: "object"
};

const log = (message: string): void => {
  try {
    appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${message}\n`);
  } catch {
    // Logging must never abort the worker.
  }
};

const isDispatchState = (value: unknown): value is DispatchState => {
  return null !== value && isObject(value) && !isArray(value);
};

const readState = (): DispatchState => {
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

/** Reads the transcript bytes after the previously-recorded offset for this conversation. */
const readTranscriptSlice = (
  transcriptPath: string,
  conversationId: string
): string => {
  const full = readFileSync(transcriptPath, "utf8");
  const record = readState()[conversationId];

  // stop.ts records the offset AFTER spawning us, so the value present here is
  // the PREVIOUS run's offset (the current dispatch is the new content beyond
  // it). On the first dispatch there is no record — read the whole file.
  if (
    undefined === record ||
    0 >= record.offset ||
    record.offset >= full.length
  ) {
    return full;
  }

  return full.slice(record.offset);
};

const isAgentApiAvailable = (): boolean => {
  try {
    // eslint-disable-next-line sonar/no-os-command-from-path -- agentapi is a documented sidecar binary injected into hook PATH
    const result = spawnSync("agentapi", ["--help"], {
      encoding: "utf8",
      shell: true,
      timeout: 10_000
    });

    return undefined === result.error && 0 === result.status;
  } catch {
    return false;
  }
};

/** agentapi path: hand the whole edit to a spawned conversation. */
const dispatchViaAgentApi = (prompt: string): boolean => {
  try {
    // eslint-disable-next-line sonar/no-os-command-from-path -- agentapi is a documented sidecar binary injected into hook PATH
    const result = spawnSync("agentapi", ["new-conversation", prompt], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 10,
      shell: true,
      timeout: 180_000
    });

    if (undefined !== result.error || 0 !== result.status) {
      log(
        `agentapi failed: status=${String(result.status)} error=${result.error?.message ?? "(none)"}`
      );
      return false;
    }

    log("agentapi extraction dispatched");
    return true;
  } catch (error) {
    log(`agentapi threw: ${isError(error) ? error.message : String(error)}`);
    return false;
  }
};

/**
 * After the agentapi path runs, guard against an over-long lessons.md by
 * hard-truncating at the last section boundary that fits under the limit.
 */
const enforceHardLimit = (lessonsPath: string): void => {
  if (!existsSync(lessonsPath)) {
    return;
  }

  const content = readFileSync(lessonsPath, "utf8");

  if (content.length <= LESSONS_HARD_LIMIT) {
    return;
  }

  const lines = split(content, "\n");
  const kept: string[] = [];
  let length = 0;
  let lastSafeLength = 0;

  for (const line of lines) {
    const addition = line.length + 1;

    if (startsWith(line, "## ") && 0 < length) {
      lastSafeLength = length;
    }

    if (length + addition > LESSONS_HARD_LIMIT) {
      break;
    }

    kept.push(line);
    length += addition;
  }

  const truncated =
    0 < lastSafeLength ? content.slice(0, lastSafeLength) : kept.join("\n");
  writeFileSync(lessonsPath, `${trim(truncated)}\n`, "utf8");
  log(
    `WARNING: lessons.md exceeded ${String(LESSONS_HARD_LIMIT)} chars; hard-truncated`
  );
};

/** Apply the lessons delta from the claude fallback to lessons.md. */
const applyLessonsUpdate = (lessonsPath: string, delta: LessonsDelta): void => {
  const fresh = existsSync(lessonsPath)
    ? trim(readFileSync(lessonsPath, "utf8"))
    : "";
  writeFileSync(lessonsPath, applyDelta(fresh, delta), "utf8");
  log("claude fallback: lessons.md updated");
};

/** Append artifact improvement suggestions to ARTIFACT_IMPROVEMENTS.md. */
const appendArtifactImprovements = (
  improvementsPath: string,
  suggestions: string
): void => {
  const dateString = new Date().toISOString().slice(0, 10);
  const header = "# Artifact Improvements\n\n";
  const section = `## Session ${dateString}\n\n${suggestions}\n\n---\n\n`;
  const existing = existsSync(improvementsPath)
    ? readFileSync(improvementsPath, "utf8")
    : "";
  const body = startsWith(existing, header)
    ? existing.slice(header.length)
    : existing;
  writeFileSync(improvementsPath, header + section + body, "utf8");
  log("claude fallback: ARTIFACT_IMPROVEMENTS.md updated");
};

/** Apply the parsed claude envelope result to lessons.md and improvements file. */
const applyClaudeResult = (
  envelope: ReturnType<typeof parseClaudeEnvelope>,
  lessonsPath: string,
  improvementsPath: string
): void => {
  if (undefined === envelope) {
    return;
  }

  const delta = envelope.lessons;

  if (delta !== undefined && !isDeltaEmpty(delta)) {
    applyLessonsUpdate(lessonsPath, delta);
  } else {
    log("claude fallback: no lessons changes");
  }

  const suggestions = trim(envelope.artifact_improvements ?? "");

  if ("" !== suggestions) {
    appendArtifactImprovements(improvementsPath, suggestions);
  }
};

/** Fallback path: claude CLI returns a structured delta we apply locally. */
const dispatchViaClaude = (
  prompt: string,
  lessonsPath: string,
  improvementsPath: string
): void => {
  /* eslint-disable sonar/no-os-command-from-path -- claude is a known CLI tool on the user's PATH */
  const result = spawnSync(
    "claude",
    [
      "--print",
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(COMBINED_SCHEMA)
    ],
    {
      encoding: "utf8",
      input: prompt,
      maxBuffer: 1024 * 1024 * 10,
      timeout: 120_000
    }
  );
  /* eslint-enable sonar/no-os-command-from-path */

  if (
    undefined !== result.error ||
    0 !== result.status ||
    "" === trim(result.stdout)
  ) {
    log(
      `claude fallback failed: status=${String(result.status)} signal=${result.signal ?? "(none)"} error=${result.error?.message ?? "(none)"}`
    );
    return;
  }

  const parsed = parseClaudeEnvelope(result.stdout);

  if (undefined === parsed) {
    log(
      `claude fallback: envelope parse failed: ${trim(result.stdout).slice(0, 200)}`
    );
    return;
  }

  applyClaudeResult(parsed, lessonsPath, improvementsPath);
};

/** Execute the worker main logic: read transcript, extract lessons, dispatch. */
const runWorker = (
  transcriptPath: string,
  conversationId: string,
  workspaceRoot: string
): void => {
  const slice = parseTranscriptSlice(
    readTranscriptSlice(transcriptPath, conversationId)
  );

  if ("" === slice) {
    log("worker: empty transcript slice; nothing to extract");
    return;
  }

  const artifacts = detectInvokedArtifacts(slice, [...CANDIDATE_ARTIFACTS]);
  log(
    `worker: ${String(slice.length)} chars of slice, artifacts=[${artifacts.join(", ")}]`
  );

  const sliceDirectory = mkdtempSync(path.join(tmpdir(), "lessons-"));
  const sliceFilePath = path.join(sliceDirectory, "transcript-slice.txt");
  writeFileSync(sliceFilePath, slice, "utf8");

  const prompt = buildExtractionPrompt({
    artifacts,
    sliceFilePath,
    workspaceRoot
  });
  const lessonsPath = path.resolve(workspaceRoot, ".agents", "lessons.md");
  const improvementsPath = path.resolve(
    workspaceRoot,
    ".agents",
    "ARTIFACT_IMPROVEMENTS.md"
  );

  if (isAgentApiAvailable()) {
    if (dispatchViaAgentApi(prompt)) {
      enforceHardLimit(lessonsPath);
      return;
    }

    log("agentapi unavailable mid-run; falling back to claude");
  } else {
    log("agentapi not on PATH; using claude fallback");
  }

  dispatchViaClaude(prompt, lessonsPath, improvementsPath);
};

const main = (): void => {
  // Truncate the log at the start of each run.
  try {
    writeFileSync(LOG_PATH, "", "utf8");
  } catch {
    // ignore
  }

  const transcriptPath = process.argv[2] ?? "";
  const conversationId = process.argv[3] ?? "";
  const workspaceRoot = process.argv[4] ?? "";

  if (
    "" === transcriptPath ||
    !existsSync(transcriptPath) ||
    "" === workspaceRoot
  ) {
    log(
      `worker: missing inputs (transcript=${transcriptPath || "(none)"}, workspace=${workspaceRoot || "(none)"})`
    );
    return;
  }

  runWorker(transcriptPath, conversationId, workspaceRoot);
};

try {
  main();
} catch (error) {
  log(`worker fatal: ${isError(error) ? error.message : String(error)}`);
}

process.exit(0);
