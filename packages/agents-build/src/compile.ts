/* eslint-disable no-console, unicorn/no-process-exit -- build/hook entry point: stdout is the wire protocol and exit codes are the contract */
/**
 * Build entry: regenerates .agents/plugins/ and .agents/hooks.json from the
 * typed definitions under content/. Wipes ONLY .agents/plugins/ — the
 * .agents/skills/ placeholder is hand-managed and .agents/lessons.md is
 * mutable state owned by the lessons hooks (seeded here only when absent).
 *
 * Run with: bun src/compile.ts
 */

import endsWith from "lodash/endsWith.js";
import filter from "lodash/filter.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import path from "node:path";

import { HOOKS, LESSONS_SEED } from "./content/hooks.ts";
import { GLOBAL_RULES } from "./content/rules/global.ts";
import { SKILLS } from "./content/skills/index.ts";
import { renderJson, ruleMarkdown, skillMarkdown } from "./render.ts";
import {
  checkRuleSize,
  findDuplicateRuleFilenames,
  findForbiddenStrings,
  findUnresolvedTokens,
  validateFrontmatterBlock,
  validateSwebokGuard
} from "./validate.ts";

const ROOT = path.join(import.meta.dirname, "..", "..", "..");
const AGENTS_DIR = path.join(ROOT, ".agents");
const SKILLS_DIR = path.join(AGENTS_DIR, "skills");
const RULES_DIR = path.join(AGENTS_DIR, "rules");

const failures: string[] = [];
const warnings: string[] = [];

const write = (filePath: string, content: string): void => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
};

rmSync(SKILLS_DIR, { force: true, recursive: true });
rmSync(RULES_DIR, { force: true, recursive: true });

let fileCount = 0;

for (const duplicate of findDuplicateRuleFilenames(GLOBAL_RULES)) {
  failures.push(`global rules: duplicate rule filename "${duplicate}"`);
}

for (const rule of GLOBAL_RULES) {
  const markdown = ruleMarkdown(rule);
  const size = checkRuleSize(markdown);

  if ("fail" === size.status) {
    failures.push(
      `rules/${rule.filename}.md: ${String(size.length)} chars exceeds the 12k rule limit`
    );
  }

  if ("warn" === size.status) {
    warnings.push(
      `rules/${rule.filename}.md: ${String(size.length)} chars is nearing the 12k rule limit`
    );
  }

  if (!validateFrontmatterBlock(markdown)) {
    failures.push(`rules/${rule.filename}.md: malformed frontmatter block`);
  }

  write(path.join(RULES_DIR, `${rule.filename}.md`), markdown);
  fileCount += 1;
}

for (const skill of SKILLS) {
  const skillDirectory = path.join(SKILLS_DIR, skill.name);
  const markdown = skillMarkdown(skill);

  if (!validateFrontmatterBlock(markdown)) {
    failures.push(`skills/${skill.name}/SKILL.md: malformed frontmatter block`);
  }

  const resourcePaths = map(skill.resources ?? [], (resource) => {
    return resource.path;
  });

  const allContent = `${markdown}\n${map(skill.resources ?? [], (resource) => {
    return resource.content;
  }).join("\n")}`;

  for (const missing of validateSwebokGuard(resourcePaths, allContent)) {
    failures.push(
      `skills/${skill.name}: resource "${missing}" is not referenced in the skill or its resources — the router table has drifted`
    );
  }

  write(path.join(skillDirectory, "SKILL.md"), markdown);
  fileCount += 1;

  for (const resource of skill.resources ?? []) {
    write(path.join(skillDirectory, resource.path), resource.content);
    fileCount += 1;
  }
}

write(path.join(AGENTS_DIR, "hooks.json"), renderJson(HOOKS));
fileCount += 1;

const lessonsPath = path.join(AGENTS_DIR, "lessons.md");

if (!existsSync(lessonsPath)) {
  write(lessonsPath, LESSONS_SEED);
  fileCount += 1;
}

for (const directory of [SKILLS_DIR, RULES_DIR]) {
  for (const token of findUnresolvedTokens(directory)) {
    failures.push(`unresolved {{sections}} token in ${token}`);
  }

  const files = filter(readdirSync(directory, { recursive: true }), isString);
  const targetFiles = filter(files, (file) => {
    return endsWith(file, ".md") || endsWith(file, ".json");
  });

  for (const file of targetFiles) {
    const filePath = path.join(directory, file);
    const fileContent = readFileSync(filePath, "utf8");

    for (const name of findForbiddenStrings(fileContent)) {
      failures.push(
        `forbidden source-workspace reference "${name}" in ${filePath}`
      );
    }
  }
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

if (0 < failures.length) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }

  process.exit(1);
}

console.log(
  `Generated ${String(fileCount)} files for ${String(SKILLS.length)} skill(s) into ${SKILLS_DIR}`
);
