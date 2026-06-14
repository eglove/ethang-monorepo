/**
Pure rendering functions for the Antigravity artifact build.

Ported from the Claude Code build system this package descends from: fixed
emission order, newline guards on every frontmatter scalar, and a single
{{sections}} token as the only templating mechanism. compile.ts owns all
I/O; everything here is unit-testable without side effects.
*/

import { generateMarkdown } from "@ethang/markdown-generator/markdown-generator.js";
import isNil from "lodash/isNil.js";

import type { RuleDefinition } from "./define.ts";

export const ruleMarkdown = (rule: RuleDefinition): string => {
  if ("model_decision" === rule.trigger && isNil(rule.description)) {
    throw new Error(
      `Rule "${rule.filename}": trigger model_decision requires a description`
    );
  }

  if ("glob" === rule.trigger && isNil(rule.globs)) {
    throw new Error(`Rule "${rule.filename}": trigger glob requires globs`);
  }

  return generateMarkdown({
    blocks: [
      { count: 0, type: "space" },
      { text: rule.content, type: "text" }
    ],
    frontmatter: {
      trigger: rule.trigger,
      ...(!isNil(rule.description) && { description: rule.description }),
      ...(!isNil(rule.globs) && { globs: rule.globs })
    }
  });
};

export const renderJson = (value: unknown): string => {
  return `${JSON.stringify(value, undefined, 2)}\n`;
};
