/**
Pure rendering functions for the Antigravity artifact build.

Ported from the Claude Code build system this package descends from: fixed
emission order, newline guards on every frontmatter scalar, and a single
{{sections}} token as the only templating mechanism. compile.ts owns all
I/O; everything here is unit-testable without side effects.
*/

import {
  generateMarkdown,
  type MarkdownBlock
} from "@ethang/markdown-generator/markdown-generator.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

import type {
  CommandDefinition,
  RuleDefinition,
  SkillDefinition
} from "./define.ts";

export const ruleMarkdown = (rule: RuleDefinition): string => {
  if ("model_decision" === rule.trigger && isNil(rule.description)) {
    throw new Error(
      `Rule "${rule.filename}": trigger model_decision requires a description`
    );
  }

  if ("glob" === rule.trigger && isNil(rule.globs)) {
    throw new Error(`Rule "${rule.filename}": trigger glob requires globs`);
  }

  const blocks: MarkdownBlock[] = isString(rule.content)
    ? [
        { count: 0, type: "space" as const },
        { text: rule.content, type: "text" as const }
      ]
    : [{ count: 0, type: "space" as const }, ...rule.content];

  return generateMarkdown({
    blocks,
    frontmatter: {
      trigger: rule.trigger,
      ...(!isNil(rule.description) && { description: rule.description }),
      ...(!isNil(rule.globs) && { globs: rule.globs })
    }
  });
};

export const commandMarkdown = (command: CommandDefinition) => {
  const blocks: MarkdownBlock[] = isString(command.content)
    ? [
        { count: 0, type: "space" as const },
        { text: command.content, type: "text" as const }
      ]
    : [{ count: 0, type: "space" as const }, ...command.content];

  return generateMarkdown({
    blocks,
    frontmatter: {
      description: command.description
    }
  });
};

export const skillMarkdown = (skill: SkillDefinition) => {
  const blocks: MarkdownBlock[] = isString(skill.content)
    ? [
        { count: 0, type: "space" as const },
        { text: skill.content, type: "text" as const }
      ]
    : [{ count: 0, type: "space" as const }, ...skill.content];

  return generateMarkdown({
    blocks,
    frontmatter: {
      description: skill.description,
      name: skill.name
    }
  });
};

export const renderJson = (value: unknown): string => {
  return `${JSON.stringify(value, undefined, 2)}\n`;
};
