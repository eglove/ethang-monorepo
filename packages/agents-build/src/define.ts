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

export type Section = {
  content: string;
  dependsOn?: string[];
  id: string;
  label: string;
};

export type SkillDefinition = {
  /** SKILL.md body; a single {{sections}} token is the only templating. */
  content: string;
  /** Frontmatter description — drives Antigravity progressive disclosure. */
  description: string;
  /** Folder name: skills/<name>/SKILL.md. */
  name: string;
  resources?: SkillResource[];
  sections?: Section[];
  /** Build-time router keywords (swebok table); never rendered to frontmatter. */
  triggers?: readonly string[];
};

export type SkillResource = {
  content: string;
  /** Path relative to the skill folder, e.g. "resources/ch05-testing.md". */
  path: string;
};

export const defineRule = (definition: RuleDefinition): RuleDefinition => {
  return definition;
};

export const defineSkill = (definition: SkillDefinition): SkillDefinition => {
  return definition;
};
