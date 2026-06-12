/**
 * Pure, I/O-free utilities for the Antigravity lessons pipeline (PreInvocation hook).
 * Kept separate so they are testable without mocking the filesystem.
 */

import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isObject from "lodash/isObject.js";
import map from "lodash/map.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";

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

  // eslint-disable-next-line unicorn/try-complexity
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
