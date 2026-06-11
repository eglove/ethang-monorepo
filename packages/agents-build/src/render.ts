/**
 * Pure rendering functions for the Antigravity artifact build.
 *
 * Ported from the Claude Code build system this package descends from: fixed
 * emission order, newline guards on every frontmatter scalar, and a single
 * {{sections}} token as the only templating mechanism. compile.ts owns all
 * I/O; everything here is unit-testable without side effects.
 */

import type {
  RuleDefinition,
  Section,
  SkillDefinition,
  SkillReference
} from "./define.ts";

const assertNoNewline = (value: string, key: string): void => {
  if (value.includes("\n")) {
    throw new Error(
      `Frontmatter value for "${key}" contains a newline; multi-line values are not allowed: ${JSON.stringify(value)}`
    );
  }
};

/**
 * YAML scalars containing ": ", "#", or quotes are ambiguous unquoted;
 * emit them as escaped double-quoted strings.
 */
const yamlScalar = (value: string): string => {
  if (!/[:"#]/u.test(value)) {
    return value;
  }

  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', String.raw`\"`)}"`;
};

/**
 * Antigravity does not document how rule activation modes are encoded in the
 * file; this emits the Windsurf-lineage `trigger:` frontmatter convention.
 * If UI verification falsifies the assumption, this is the only function to
 * change.
 */
export const renderRuleFrontmatter = (rule: RuleDefinition): string => {
  const lines = [`trigger: ${rule.trigger}`];

  if ("model_decision" === rule.trigger) {
    if (undefined === rule.description) {
      throw new Error(
        `Rule "${rule.filename}": trigger model_decision requires a description`
      );
    }

    assertNoNewline(rule.description, "description");
    lines.push(`description: ${yamlScalar(rule.description)}`);
  }

  if ("glob" === rule.trigger) {
    if (undefined === rule.globs) {
      throw new Error(`Rule "${rule.filename}": trigger glob requires globs`);
    }

    assertNoNewline(rule.globs, "globs");
    lines.push(`globs: ${rule.globs}`);
  }

  return `---\n${lines.join("\n")}\n---\n`;
};

export const renderSkillFrontmatter = (skill: SkillDefinition): string => {
  assertNoNewline(skill.name, "name");
  assertNoNewline(skill.description, "description");

  return `---\nname: ${skill.name}\ndescription: ${yamlScalar(skill.description)}\n---\n`;
};

export const resolveSections = (sections: Section[], label: string): string => {
  const declaredIds = new Set(
    sections.map((section) => {
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

export const resolveSkillRefs = (
  skillReferences: readonly SkillReference[]
): string => {
  const seen = new Set<string>();
  const blocks: string[] = [];

  for (const reference of skillReferences) {
    if (!seen.has(reference.skill)) {
      seen.add(reference.skill);
      blocks.push(`### \`${reference.skill}\`\n\n${reference.description}`);
    }
  }

  return `## Skills\n\n${blocks.join("\n\n")}`;
};

const resolveSkillBody = (skill: SkillDefinition): string => {
  const hasContent =
    0 < (skill.sections?.length ?? 0) || 0 < (skill.skillRefs?.length ?? 0);

  if (!hasContent) {
    return skill.content;
  }

  if (!skill.content.includes("{{sections}}")) {
    throw new Error(
      `Skill "${skill.name}": sections/skillRefs declared but {{sections}} token missing from content`
    );
  }

  const parts: string[] = [];

  if (0 < (skill.sections?.length ?? 0)) {
    parts.push(resolveSections(skill.sections ?? [], `skill:${skill.name}`));
  }

  if (0 < (skill.skillRefs?.length ?? 0)) {
    parts.push(resolveSkillRefs(skill.skillRefs ?? []));
  }

  return skill.content.replace("{{sections}}", parts.join("\n\n---\n\n"));
};

export const skillMarkdown = (skill: SkillDefinition): string => {
  return `${renderSkillFrontmatter(skill)}\n${resolveSkillBody(skill)}\n`;
};

export const ruleMarkdown = (rule: RuleDefinition): string => {
  return `${renderRuleFrontmatter(rule)}\n${rule.content}\n`;
};

export const renderJson = (value: unknown): string => {
  return `${JSON.stringify(value, undefined, 2)}\n`;
};

export const pluginJson = (name: string): string => {
  return renderJson({ name });
};
