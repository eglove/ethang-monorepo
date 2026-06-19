export type RuleDefinition = {
  content: string;
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
  content: string;
  description: string;
  name: string;
  resources?: { content: string; filename: string }[];
};

export const defineSkill = (definition: SkillDefinition): SkillDefinition => {
  return definition;
};
