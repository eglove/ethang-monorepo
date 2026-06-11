/**
 * Pure, I/O-free utilities for the Antigravity lessons pipeline (Stop +
 * PreInvocation hooks). Kept separate so they are testable without mocking the
 * filesystem, the transcript, or the spawned extraction conversation.
 *
 * Ported from the Claude Code session-end hook this descends from. The
 * Antigravity transcript format is UNVERIFIED, so transcript parsing is lenient
 * with a raw-text fallback and never throws.
 */

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

export type ExtractionPromptArgs = {
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
};

// ── constants ───────────────────────────────────────────────────────────────────

/** Last-N-chars cap for the raw-text fallback when JSONL parsing fails. */
const RAW_FALLBACK_CAP = 50_000;

/** Assistant turns are truncated to keep the extraction prompt bounded. */
const ASSISTANT_TURN_CAP = 800;

/** Default rate-limit window between dispatches for the same conversation. */
export const DEFAULT_MIN_INTERVAL_MS = 60 * 60 * 1000;

/** Soft ceiling the extraction prompt instructs the model to keep lessons under. */
export const LESSONS_SOFT_LIMIT = 11_000;

// ── hook stdin parsing ──────────────────────────────────────────────────────────

/** Lenient parse of a hook's JSON stdin payload into a plain object, or undefined. */
export const parseHookInput = (
  raw: string
): Record<string, unknown> | undefined => {
  const trimmed = raw.trim();

  if ("" === trimmed) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (
      null === parsed ||
      "object" !== typeof parsed ||
      Array.isArray(parsed)
    ) {
      return undefined;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

// ── transcript parsing ──────────────────────────────────────────────────────────

const extractText = (content: ContentBlock[] | string): string => {
  if ("string" === typeof content) {
    return content;
  }

  return content
    .filter((block): block is { text: string } & ContentBlock => {
      return "text" === block.type && undefined !== block.text;
    })
    .map((block) => {
      return block.text;
    })
    .join("");
};

const isToolResult = (content: ContentBlock[] | string): boolean => {
  if ("string" === typeof content) {
    return false;
  }

  return content.some((block) => {
    return "tool_result" === block.type;
  });
};

const turnFromEntry = (entry: TranscriptEntry): string => {
  const role = entry.message?.role ?? entry.role;
  const content = entry.message?.content ?? entry.content;

  if (undefined === role || undefined === content) {
    return "";
  }

  if (("user" === role || "human" === role) && !isToolResult(content)) {
    const text = extractText(content).trim();
    return "" === text ? "" : `User: ${text}`;
  }

  if ("assistant" === role) {
    const text = extractText(content).trim();
    return "" === text ? "" : `Claude: ${text.slice(0, ASSISTANT_TURN_CAP)}`;
  }

  return "";
};

/**
 * Lenient JSONL parse of a transcript slice into a flat turn-per-line string.
 * If NO line parses as a recognizable turn, fall back to the raw text capped to
 * the last RAW_FALLBACK_CAP characters. Never throws.
 */
export const parseTranscriptSlice = (raw: string): string => {
  if ("" === raw.trim()) {
    return "";
  }

  const turns: string[] = [];
  let sawJson = false;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();

    if ("" === trimmed) {
      continue;
    }

    try {
      const entry = JSON.parse(trimmed) as TranscriptEntry;
      sawJson = true;
      const turn = turnFromEntry(entry);

      if ("" !== turn) {
        turns.push(turn);
      }
    } catch {
      // Not JSON — tolerated; raw fallback covers fully non-JSON transcripts.
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
    if (found.includes(candidate)) {
      continue;
    }

    const escaped = candidate.replaceAll(
      /[.*+?^${}()|[\]\\]/gu,
      String.raw`\$&`
    );

    if (new RegExp(String.raw`(?<![\w-])${escaped}(?![\w-])`, "u").test(text)) {
      found.push(candidate);
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
  arguments_: ExtractionPromptArgs
): string => {
  const { artifacts, sliceFilePath, workspaceRoot } = arguments_;
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
told to change — and (b) non-obvious patterns confirmed to work in this
workspace. Ignore transient errors and generic programming advice.

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

export const isDeltaEmpty = (delta: LessonsDelta): boolean => {
  const empty = (section?: SectionDelta): boolean => {
    return (
      undefined === section ||
      (!section.add?.length &&
        !section.modify?.length &&
        !section.remove?.length)
    );
  };

  return empty(delta.corrections) && empty(delta.patterns);
};

export const parseSectionEntries = (
  content: string,
  sectionTitle: string
): string[] => {
  const entries: string[] = [];
  let inSection = false;

  for (const line of content.split("\n")) {
    if (line.startsWith("## ")) {
      inSection = line.includes(sectionTitle);
      continue;
    }

    if (inSection && line.trim().startsWith("- ")) {
      entries.push(line.trim());
    }
  }

  return entries;
};

export const applySection = (
  entries: string[],
  delta?: SectionDelta
): string[] => {
  if (undefined === delta) {
    return entries;
  }

  let result = [...entries];

  for (const removal of delta.remove ?? []) {
    result = result.filter((entry) => {
      return entry.trim() !== removal.trim();
    });
  }

  for (const { new: newLine, old: oldLine } of delta.modify ?? []) {
    const index = result.findIndex((entry) => {
      return entry.trim() === oldLine.trim();
    });

    if (-1 !== index) {
      result[index] = newLine.startsWith("- ") ? newLine : `- ${newLine}`;
    }
  }

  for (const addition of delta.add ?? []) {
    const normalized = addition.startsWith("- ") ? addition : `- ${addition}`;

    if (
      !result.some((entry) => {
        return entry.trim() === normalized.trim();
      })
    ) {
      result.push(normalized);
    }
  }

  return result;
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

  const renderSection = (entries: string[]): string => {
    return 0 < entries.length ? entries.join("\n") : "*(none yet)*";
  };

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

/** Unwraps the `claude --print --output-format json` envelope's structured_output. */
export const parseClaudeEnvelope = (
  stdout: string
): ClaudeEnvelopeOutput | undefined => {
  try {
    const envelope = JSON.parse(stdout.trim()) as {
      structured_output?: ClaudeEnvelopeOutput;
    };

    return envelope.structured_output ?? undefined;
  } catch {
    return undefined;
  }
};
