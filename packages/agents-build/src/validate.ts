/**
 * Post-build tripwires. Every check returns violations instead of throwing so
 * compile.ts can aggregate and report all failures in one pass.
 */

import endsWith from "lodash/endsWith.js";
import every from "lodash/every.js";
import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import type { RuleDefinition } from "./define.ts";

import {
  FORBIDDEN_PATTERNS,
  RULE_CHAR_LIMIT,
  RULE_WARN_CHARS
} from "./config.ts";

/**
 * A rendered markdown file must open with a well-formed frontmatter block:
 * `---`, `key: value` lines only, closing `---`.
 */
export const validateFrontmatterBlock = (markdown: string): boolean => {
  if (!startsWith(markdown, "---\n")) {
    return false;
  }

  const rest = markdown.slice(4);
  const closeIndex = rest.indexOf("\n---");

  if (-1 === closeIndex) {
    return false;
  }

  const linePattern = /^[a-z][a-z-]*: .+$/iu;

  return every(split(rest.slice(0, closeIndex), "\n"), (line) => {
    return linePattern.test(line);
  });
};

export const checkRuleSize = (
  content: string
): { length: number; status: "fail" | "ok" | "warn" } => {
  const { length } = content;

  if (RULE_CHAR_LIMIT < length) {
    return { length, status: "fail" };
  }

  if (RULE_WARN_CHARS <= length) {
    return { length, status: "warn" };
  }

  return { length, status: "ok" };
};

/** Names of forbidden source-workspace vocabulary found in the content. */
export const findForbiddenStrings = (content: string): string[] => {
  return map(
    filter(FORBIDDEN_PATTERNS, ({ pattern }) => {
      return pattern.test(content);
    }),
    ({ name }) => {
      return name;
    }
  );
};

/** Shared rules merged with plugin rules must not collide on filename. */
export const findDuplicateRuleFilenames = (
  rules: RuleDefinition[]
): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const rule of rules) {
    if (seen.has(rule.filename)) {
      duplicates.add(rule.filename);
    }

    seen.add(rule.filename);
  }

  return [...duplicates];
};

/**
 * Tripwire against hand-editing the generated swebok router: every chapter
 * resource path must appear verbatim in the rendered router skill. Returns
 * the paths that are absent.
 */
export const validateSwebokGuard = (
  resourcePaths: readonly string[],
  routerContent: string
): string[] => {
  return filter(resourcePaths, (resourcePath) => {
    return !includes(routerContent, resourcePath);
  });
};

/** Scan a built directory tree for leftover {{sections}} tokens. */
export const findUnresolvedTokens = (directory: string): string[] => {
  const violations: string[] = [];

  for (const file of filter(
    readdirSync(directory, { recursive: true }),
    isString
  )) {
    if (endsWith(file, ".md")) {
      const content = readFileSync(path.join(directory, file), "utf8");

      if (includes(content, "{{sections}}")) {
        violations.push(path.join(directory, file));
      }
    }
  }

  return violations;
};
