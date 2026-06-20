/**
Post-build tripwires. Every check returns violations instead of throwing so
compile.ts can aggregate and report all failures in one pass.
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
  RULE_MAX_CHARS,
  RULE_MIN_CHARS
} from "./config.ts";

/**
A rendered markdown file must open with a well-formed frontmatter block:
`---`, `key: value` lines only, closing `---`.
*/
export const isValidFrontmatterBlock = (markdown: string): boolean => {
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
): { length: number; status: "fail" | "ok" } => {
  const { length } = content;

  if (length < RULE_MIN_CHARS || length > RULE_MAX_CHARS) {
    return { length, status: "fail" };
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

/** Scan a built directory tree for leftover {{sections}} tokens. */
export const findUnresolvedTokens = (directory: string): string[] => {
  const violations: string[] = [];

  const files = filter(readdirSync(directory, { recursive: true }), isString);
  const mdFiles = filter(files, (item) => {
    return endsWith(item, ".md");
  });

  for (const file of mdFiles) {
    const content = readFileSync(path.join(directory, file), "utf8");

    if (includes(content, "{{sections}}")) {
      violations.push(path.join(directory, file));
    }
  }

  return violations;
};
