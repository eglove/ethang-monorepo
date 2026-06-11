/**
 * Pure, I/O-free utilities for the Antigravity lessons pipeline (Stop +
 * PreInvocation hooks). Kept separate so they are testable without mocking the
 * filesystem, the transcript, or the spawned extraction conversation.
 *
 * Ported from the Claude Code session-end hook this descends from. The
 * Antigravity transcript format is UNVERIFIED, so transcript parsing is lenient
 * with a raw-text fallback and never throws.
 */

import filter from "lodash/filter.js";
import findIndex from "lodash/findIndex.js";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";

// ── types ─────────────────────────────────────────────────────────────────────

export type ClaudeEnvelopeOutput = {
  artifact_improvements?: string;
  lessons?: LessonsDelta;
};

/** Per-conversation dedupe record: byte offset already extracted + last dispatch. */
export type DispatchRecord = {
  lastDispatch: number;
  offset: number;
};

export type DispatchState = Record<string, DispatchRecord>;

export type ExtractionPromptArguments = {
  artifacts: string[];
  sliceFilePath: string;
  workspaceRoot: string;
};

export type LessonsDelta = {
  corrections?: SectionDelta;
  patterns?: SectionDelta;
};

export type ModifyEntry = {
  new: string;
  old: string;
};

export type SectionDelta = {
  add?: string[];
  modify?: ModifyEntry[];
  remove?: string[];
};

type ContentBlock = {
  text?: string;
  type?: string;
};

type TranscriptEntry = {
  content?: ContentBlock[] | string;
  message?: { content?: ContentBlock[] | string; role?: string };
  role?: string;
  source?: string;
  thinking?: string;
  type?: string;
};

// ── constants ───────────────────────────────────────────────────────────────────

/** Last-N-chars cap for the raw-text fallback when JSONL parsing fails. */
const RAW_FALLBACK_CAP = 50_000;

/** Assistant turns are truncated to keep the extraction prompt bounded. */
const ASSISTANT_TURN_CAP = 800;

/** Default rate-limit window between dispatches for the same conversation. */
export const DEFAULT_MIN_INTERVAL_MS = 5 * 60 * 1000;

/** Soft ceiling the extraction prompt instructs the model to keep lessons under. */
export const LESSONS_SOFT_LIMIT = 11_000;

// ── type predicates ────────────────────────────────────────────────────────────

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return null !== value && isObject(value) && !isArray(value);
};

// ── hook stdin parsing ──────────────────────────────────────────────────────────

/** Lenient parse of a hook's JSON stdin payload into a plain object, or undefined. */
export const parseHookInput = (
  raw: string
): Record<string, unknown> | undefined => {
  const trimmed = trim(raw);

  if ("" === trimmed) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (!isPlainObject(parsed)) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
};

// ── transcript parsing ──────────────────────────────────────────────────────────

const extractText = (content: ContentBlock[] | string): string => {
  if (isString(content)) {
    return content;
  }

  return map(
    filter(content, (block): block is { text: string } & ContentBlock => {
      return "text" === block.type && undefined !== block.text;
    }),
    (block) => {
      return block.text;
    }
  ).join("");
};

const isToolResult = (content: ContentBlock[] | string): boolean => {
  if (isString(content)) {
    return false;
  }

  return some(content, (block) => {
    return "tool_result" === block.type;
  });
};

const turnFromEntryUserRole = (
  role: string,
  content: ContentBlock[] | string
): string => {
  if (("user" === role || "human" === role) && !isToolResult(content)) {
    const text = trim(extractText(content));
    return "" === text ? "" : `User: ${text}`;
  }

  return "";
};

const turnFromEntryAssistantRole = (
  role: string,
  content: ContentBlock[] | string
): string => {
  if ("assistant" === role) {
    const text = trim(extractText(content));
    return "" === text ? "" : `Claude: ${text.slice(0, ASSISTANT_TURN_CAP)}`;
  }

  return "";
};

const turnFromAntigravityUser = (
  source: string,
  type: string,
  content: unknown
): string | undefined => {
  if (
    "USER_INPUT" === type &&
    startsWith(source, "USER") &&
    isString(content)
  ) {
    const text = trim(content);
    return "" === text ? "" : `User: ${text}`;
  }
  return undefined;
};

const turnFromAntigravityModel = (
  source: string,
  type: string,
  thinking: unknown
): string | undefined => {
  if ("PLANNER_RESPONSE" === type && "MODEL" === source && isString(thinking)) {
    const text = trim(thinking);
    return "" === text ? "" : `Claude: ${text.slice(0, ASSISTANT_TURN_CAP)}`;
  }
  return undefined;
};

const turnFromAntigravityEntry = (
  entry: TranscriptEntry
): string | undefined => {
  const { content, source, thinking, type } = entry;

  if (!isString(source) || !isString(type)) {
    return undefined;
  }

  return (
    turnFromAntigravityUser(source, type, content) ??
    turnFromAntigravityModel(source, type, thinking)
  );
};

const turnFromEntry = (entry: TranscriptEntry): string => {
  const antigravityTurn = turnFromAntigravityEntry(entry);

  if (undefined !== antigravityTurn) {
    return antigravityTurn;
  }

  const role = entry.message?.role ?? entry.role;
  const content = entry.message?.content ?? entry.content;

  if (undefined === role || undefined === content) {
    return "";
  }

  const userTurn = turnFromEntryUserRole(role, content);

  if ("" !== userTurn) {
    return userTurn;
  }

  return turnFromEntryAssistantRole(role, content);
};

/**
 * Lenient JSONL parse of a transcript slice into a flat turn-per-line string.
 * If NO line parses as a recognizable turn, fall back to the raw text capped to
 * the last RAW_FALLBACK_CAP characters. Never throws.
 */
const safeParseTranscriptEntry = (parsed: unknown): TranscriptEntry => {
  if (isPlainObject(parsed)) {
    return parsed;
  }

  return {};
};

const parseJsonlLine = (trimmedLine: string, turns: string[]): boolean => {
  try {
    const parsed: unknown = JSON.parse(trimmedLine);
    const entry = safeParseTranscriptEntry(parsed);
    const turn = turnFromEntry(entry);

    if ("" !== turn) {
      turns.push(turn);
    }

    return true; // saw valid JSON
  } catch {
    return false; // not JSON
  }
};

export const parseTranscriptSlice = (raw: string): string => {
  if ("" === trim(raw)) {
    return "";
  }

  const turns: string[] = [];
  let sawJson = false;

  for (const line of split(raw, "\n")) {
    const trimmedLine = trim(line);

    if ("" !== trimmedLine) {
      sawJson = parseJsonlLine(trimmedLine, turns) || sawJson;
    }
  }

  if (0 < turns.length) {
    return turns.join("\n\n");
  }

  // No usable turns. If at least one line was JSON it was simply empty of
  // user/assistant content; otherwise fall back to raw text (capped).
  if (sawJson) {
    return "";
  }

  return raw.length > RAW_FALLBACK_CAP
    ? raw.slice(raw.length - RAW_FALLBACK_CAP)
    : raw;
};

// ── artifact detection ──────────────────────────────────────────────────────────

/**
 * Detect which candidate artifact names (plugin skills + rules) are mentioned in
 * the transcript text. Candidates are passed in so detection is testable and not
 * hard-coupled to the current artifact set. Whole-word match; result preserves
 * candidate-list order and is deduplicated.
 */
export const detectInvokedArtifacts = (
  text: string,
  candidates: string[]
): string[] => {
  const found: string[] = [];

  for (const candidate of candidates) {
    if (!includes(found, candidate)) {
      const escaped = candidate.replaceAll(
        /[.*+?^${}()|[\]\\]/gu,
        String.raw`\$&`
      );
      const pattern = new RegExp(
        String.raw`(?<![\w-])${escaped}(?![\w-])`,
        "u"
      );

      if (pattern.test(text)) {
        found.push(candidate);
      }
    }
  }

  return found;
};

// ── dispatch dedupe ───────────────────────────────────────────────────────────

/**
 * Decide whether the Stop hook should dispatch an extraction for this
 * conversation. True only when BOTH hold:
 *   1. the transcript has grown past the byte offset already extracted, and
 *   2. the previous dispatch is at least `minIntervalMs` old (rate limit).
 * A zero-size transcript never dispatches.
 */
export const shouldDispatch = (
  state: DispatchState,
  conversationId: string,
  transcriptSize: number,
  now: number,
  minIntervalMs: number
): boolean => {
  if (0 >= transcriptSize) {
    return false;
  }

  const record = state[conversationId];

  if (undefined === record) {
    return true;
  }

  if (transcriptSize <= record.offset) {
    return false;
  }

  return now - record.lastDispatch >= minIntervalMs;
};

// ── extraction prompt ───────────────────────────────────────────────────────────

/**
 * Build the prompt for the spawned extraction conversation (agentapi or the
 * claude CLI fallback). It owns the entire behavioral contract: what to read,
 * what to write, the size ceiling, the section skeleton, and the
 * touch-nothing-else / never-commit guardrails.
 */
export const buildExtractionPrompt = (
  promptArguments: ExtractionPromptArguments
): string => {
  const { artifacts, sliceFilePath, workspaceRoot } = promptArguments;
  const lessonsPath = `${workspaceRoot}/.agents/lessons.md`;
  const improvementsPath = `${workspaceRoot}/.agents/ARTIFACT_IMPROVEMENTS.md`;

  const artifactSection =
    0 < artifacts.length
      ? `
## Task 2: artifact improvements

These workspace artifacts were used in this session: ${artifacts.join(", ")}.
Review the transcript against how each was applied and identify genuine
improvement opportunities (misapplied instructions, gaps, ambiguity).
APPEND your findings to \`${improvementsPath}\` (append-only, newest session
first — prepend a new dated section above existing content). Skip artifacts with
no issues. Do not rewrite or reorder existing entries.`
      : "";

  return `You are maintaining workspace intelligence for a software project. Work \
silently and make only the file edits described below.

## Source

Read the session transcript slice at this path: \`${sliceFilePath}\`.
Identify (a) explicit user corrections — things the assistant did wrong and was
told to change or avoid —, (b) implicit developer preferences, style/command
preferences, and architectural decisions established during the session, and
(c) non-obvious patterns confirmed to work in this workspace. Ignore transient
errors and generic programming advice.

## Task 1: update lessons.md

Re-read \`${lessonsPath}\` FRESH (another session may have changed it). Apply your
changes in this order: first remove contradicted entries, then modify entries to
consolidate or strengthen them, then add new entries. Keep the file under 11,000
characters by pruning the oldest Proven Patterns entries first when needed.
Preserve this exact structure:

# Learned Lessons

## Corrections
(rules from explicit user corrections)

## Proven Patterns
(approaches confirmed to work well)
${artifactSection}

## Guardrails

Touch NO other files. Never commit; never run git.`;
};

// ── delta application (ported) ────────────────────────────────────────────────

const hasAddOrRemove = (section: SectionDelta): boolean => {
  return 0 < (section.add?.length ?? 0) || 0 < (section.remove?.length ?? 0);
};

const hasSectionItems = (section: SectionDelta): boolean => {
  return hasAddOrRemove(section) || 0 < (section.modify?.length ?? 0);
};

const isSectionDeltaEmpty = (section?: SectionDelta): boolean => {
  if (undefined === section) {
    return true;
  }

  return !hasSectionItems(section);
};

export const isDeltaEmpty = (delta: LessonsDelta): boolean => {
  return (
    isSectionDeltaEmpty(delta.corrections) &&
    isSectionDeltaEmpty(delta.patterns)
  );
};

export const parseSectionEntries = (
  content: string,
  sectionTitle: string
): string[] => {
  const entries: string[] = [];
  let inSection = false;

  for (const line of split(content, "\n")) {
    if (startsWith(line, "## ")) {
      inSection = includes(line, sectionTitle);
    } else if (inSection && startsWith(trim(line), "- ")) {
      entries.push(trim(line));
    } else {
      // Non-heading, non-bullet line — skip
    }
  }

  return entries;
};

const applyRemovals = (entries: string[], removals: string[]): string[] => {
  return filter(entries, (entry) => {
    return !some(removals, (removal) => {
      return trim(entry) === trim(removal);
    });
  });
};

const applyModifications = (
  entries: string[],
  modifications: ModifyEntry[]
): string[] => {
  const result = [...entries];

  for (const { new: newLine, old: oldLine } of modifications) {
    const index = findIndex(result, (entry) => {
      return trim(entry) === trim(oldLine);
    });

    if (-1 !== index) {
      result[index] = startsWith(newLine, "- ") ? newLine : `- ${newLine}`;
    }
  }

  return result;
};

const applyAdditions = (entries: string[], additions: string[]): string[] => {
  const result = [...entries];

  for (const addition of additions) {
    const normalized = startsWith(addition, "- ") ? addition : `- ${addition}`;

    if (
      !some(result, (entry) => {
        return trim(entry) === trim(normalized);
      })
    ) {
      result.push(normalized);
    }
  }

  return result;
};

export const applySection = (
  entries: string[],
  delta?: SectionDelta
): string[] => {
  if (undefined === delta) {
    return entries;
  }

  const afterRemovals = applyRemovals(entries, delta.remove ?? []);
  const afterModifications = applyModifications(
    afterRemovals,
    delta.modify ?? []
  );
  return applyAdditions(afterModifications, delta.add ?? []);
};

const renderSection = (entries: string[]): string => {
  return 0 < entries.length ? entries.join("\n") : "*(none yet)*";
};

export const applyDelta = (existing: string, delta: LessonsDelta): string => {
  const corrections = applySection(
    parseSectionEntries(existing, "Corrections"),
    delta.corrections
  );
  const patterns = applySection(
    parseSectionEntries(existing, "Proven Patterns"),
    delta.patterns
  );

  return `# Learned Lessons

## Corrections
Rules from explicit user corrections — things the assistant did wrong and must not repeat.

${renderSection(corrections)}

## Proven Patterns
Approaches confirmed to work well in this workspace.

${renderSection(patterns)}
`;
};

// ── claude envelope (ported) ────────────────────────────────────────────────────

const isEnvelopeShape = (
  value: unknown
): value is { structured_output?: ClaudeEnvelopeOutput } => {
  return isPlainObject(value);
};

/** Unwraps the `claude --print --output-format json` envelope's structured_output. */
export const parseClaudeEnvelope = (
  stdout: string
): ClaudeEnvelopeOutput | undefined => {
  try {
    const envelope: unknown = JSON.parse(trim(stdout));

    if (!isEnvelopeShape(envelope)) {
      return undefined;
    }

    return envelope.structured_output ?? undefined;
  } catch {
    return undefined;
  }
};

// ── pre-invocation session start helpers ────────────────────────────────────────

const SEED_MARKERS = ["*(none yet)*"];

/** True when lessons.md holds only the seed skeleton (no real learned content). */
export const isSeedOnly = (content: string): boolean => {
  const trimmedContent = trim(content);
  if ("" === trimmedContent) {
    return true;
  }

  const bulletLines = filter(
    map(split(trimmedContent, "\n"), (line) => {
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
    return includes(trimmedContent, marker);
  });
};

export const getPreInvocationResponse = (
  invocationNumber: number | undefined,
  lessonsContent: string | undefined
): { injectSteps?: { ephemeralMessage: string }[] } => {
  if (1 !== invocationNumber) {
    return {};
  }

  const injectSteps: { ephemeralMessage: string }[] = [
    {
      ephemeralMessage: `# SWEBOK v4 Standards & Glossary\n\nAll requirements analysis, design, testing, and maintenance work must align with SWEBOK v4 guidelines:\n* **Always read** the [swebok](.agents/skills/swebok/SKILL.md) glossary and chapter index first to align on vocabulary and find the matching chapter resource path.\n* Read the matching \`resources/chNN-*.md\` file inside that skill (maximum 3 chapters per task to conserve context).\n* Reference the cross-cutting vocabulary (e.g., distinguishing between **Error**, **Defect/Fault**, and **Failure**).`
    }
  ];

  if (undefined !== lessonsContent && !isSeedOnly(lessonsContent)) {
    injectSteps.push({
      ephemeralMessage: `# Learned Lessons (from previous sessions)\n\n${trim(lessonsContent)}`
    });
  }

  return { injectSteps };
};
