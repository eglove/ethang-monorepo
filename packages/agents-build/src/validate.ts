/**
 * Post-build tripwires. Every check returns violations instead of throwing so
 * compile.ts can aggregate and report all failures in one pass.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { PluginDefinition, RuleDefinition } from "./define.ts";

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
  if (!markdown.startsWith("---\n")) {
    return false;
  }

  const rest = markdown.slice(4);
  const closeIndex = rest.indexOf("\n---");

  if (-1 === closeIndex) {
    return false;
  }

  const linePattern = /^[a-z][a-z-]*: .+$/iu;

  return rest
    .slice(0, closeIndex)
    .split("\n")
    .every((line) => {
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
  return FORBIDDEN_PATTERNS.filter(({ pattern }) => {
    return pattern.test(content);
  }).map(({ name }) => {
    return name;
  });
};

/** Every skillRef must point at a sibling skill bundled in the same plugin. */
export const validateSkillRefIntegrity = (
  plugin: PluginDefinition
): string[] => {
  const siblingNames = new Set(
    plugin.skills.map((skill) => {
      return skill.name;
    })
  );
  const violations: string[] = [];

  for (const skill of plugin.skills) {
    for (const reference of skill.skillRefs ?? []) {
      if (!siblingNames.has(reference.skill)) {
        violations.push(
          `${plugin.name}/${skill.name} -> missing sibling skill "${reference.skill}"`
        );
      }
    }
  }

  return violations;
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
  return resourcePaths.filter((path) => {
    return !routerContent.includes(path);
  });
};

/** Scan a built directory tree for leftover {{sections}} tokens. */
export const findUnresolvedTokens = (directory: string): string[] => {
  const violations: string[] = [];

  for (const file of readdirSync(directory, {
    recursive: true
  }) as string[]) {
    if (!file.endsWith(".md")) {
      continue;
    }

    const content = readFileSync(join(directory, file), "utf8");

    if (content.includes("{{sections}}")) {
      violations.push(join(directory, file));
    }
  }

  return violations;
};
