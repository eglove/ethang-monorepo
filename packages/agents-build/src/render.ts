/**
 * Pure rendering functions for the Antigravity artifact build.
 *
 * Ported from the Claude Code build system this package descends from: fixed
 * emission order, newline guards on every frontmatter scalar, and a single
 * {{sections}} token as the only templating mechanism. compile.ts owns all
 * I/O; everything here is unit-testable without side effects.
 */

import { generateMarkdown } from "@ethang/markdown-generator/markdown-generator.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import replace from "lodash/replace.js";

import type { RuleDefinition, Section, SkillDefinition } from "./define.ts";

export const resolveSections = (sections: Section[], label: string): string => {
  const declaredIds = new Set(
    map(sections, (section) => {
      return section.id;
    })
  );

  for (const section of sections) {
    for (const dependency of section.dependsOn ?? []) {
      if (!declaredIds.has(dependency)) {
        throw new Error(
          `[${label}] Section "${section.id}" depends on "${dependency}" but "${dependency}" is not in the sections array`
        );
      }
    }
  }

  const seen = new Set<string>();
  const blocks: string[] = [];

  for (const section of sections) {
    if (!seen.has(section.id)) {
      seen.add(section.id);
      blocks.push(section.content);
    }
  }

  return blocks.join("\n\n---\n\n");
};

const resolveSkillBody = (skill: SkillDefinition): string => {
  const { content, name, sections } = skill;
  if (isNil(sections) || 0 === sections.length) {
    return content;
  }

  if (!includes(content, "{{sections}}")) {
    throw new Error(
      `Skill "${name}": sections declared but {{sections}} token missing from content`
    );
  }

  const parts = [resolveSections(sections, `skill:${name}`)];

  return replace(content, "{{sections}}", parts.join("\n\n---\n\n"));
};

export const skillMarkdown = (skill: SkillDefinition): string => {
  return generateMarkdown({
    blocks: [
      { count: 0, type: "space" },
      { text: resolveSkillBody(skill), type: "text" }
    ],
    frontmatter: {
      description: skill.description,
      name: skill.name
    }
  });
};

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
      ...(isNil(rule.description) ? {} : { description: rule.description }),
      ...(isNil(rule.globs) ? {} : { globs: rule.globs })
    }
  });
};

export const renderJson = (value: unknown): string => {
  return `${JSON.stringify(value, undefined, 2)}\n`;
};
