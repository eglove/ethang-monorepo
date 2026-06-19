import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export type RuleDefinition = {
  content: MarkdownBlock[] | string;
  /** Required when trigger is "model_decision" (build-validated). */
  description?: string;
  /** Output filename without .md — emitted as rules/<filename>.md in each plugin. */
  filename: string;
  /** Required when trigger is "glob" (build-validated). */
  globs?: string;
  trigger: RuleTrigger;
};

export type RuleTrigger = "always_on" | "glob" | "manual" | "model_decision";

export const defineRule = (definition: RuleDefinition): RuleDefinition => {
  return definition;
};

export type SkillDefinition = {
  content: MarkdownBlock[] | string;
  description: string;
  name: string;
  resources?: { content: MarkdownBlock[] | string; filename: string }[];
};

export const defineSkill = (definition: SkillDefinition): SkillDefinition => {
  return definition;
};
