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
import { PLUGINS } from "./content/plugins/index.ts";
import { SHARED_RULES } from "./content/rules/shared.ts";
import {
  pluginJson,
  renderJson,
  ruleMarkdown,
  skillMarkdown
} from "./render.ts";
import {
  checkRuleSize,
  findDuplicateRuleFilenames,
  findForbiddenStrings,
  findUnresolvedTokens,
  validateFrontmatterBlock,
  validateSkillReferenceIntegrity,
  validateSwebokGuard
} from "./validate.ts";

const ROOT = path.join(import.meta.dirname, "..", "..", "..");
const AGENTS_DIR = path.join(ROOT, ".agents");
const PLUGINS_DIR = path.join(AGENTS_DIR, "plugins");

const failures: string[] = [];
const warnings: string[] = [];

const write = (filePath: string, content: string): void => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
};

rmSync(PLUGINS_DIR, { force: true, recursive: true });

let fileCount = 0;

for (const plugin of PLUGINS) {
  const pluginDirectory = path.join(PLUGINS_DIR, plugin.name);

  write(path.join(pluginDirectory, "plugin.json"), pluginJson(plugin.name));
  fileCount += 1;

  const mergedRules = [...SHARED_RULES, ...(plugin.rules ?? [])];

  for (const duplicate of findDuplicateRuleFilenames(mergedRules)) {
    failures.push(
      `${plugin.name}: duplicate rule filename "${duplicate}" after shared-rule merge`
    );
  }

  for (const rule of mergedRules) {
    const markdown = ruleMarkdown(rule);
    const size = checkRuleSize(markdown);

    if ("fail" === size.status) {
      failures.push(
        `${plugin.name}/rules/${rule.filename}.md: ${String(size.length)} chars exceeds the 12k rule limit`
      );
    }

    if ("warn" === size.status) {
      warnings.push(
        `${plugin.name}/rules/${rule.filename}.md: ${String(size.length)} chars is nearing the 12k rule limit`
      );
    }

    if (!validateFrontmatterBlock(markdown)) {
      failures.push(
        `${plugin.name}/rules/${rule.filename}.md: malformed frontmatter block`
      );
    }

    write(path.join(pluginDirectory, "rules", `${rule.filename}.md`), markdown);
    fileCount += 1;
  }

  for (const violation of validateSkillReferenceIntegrity(plugin)) {
    failures.push(violation);
  }

  for (const skill of plugin.skills) {
    const markdown = skillMarkdown(skill);

    if (!validateFrontmatterBlock(markdown)) {
      failures.push(
        `${plugin.name}/skills/${skill.name}/SKILL.md: malformed frontmatter block`
      );
    }

    const resourcePaths = map(skill.resources ?? [], (resource) => {
      return resource.path;
    });

    for (const missing of validateSwebokGuard(resourcePaths, markdown)) {
      failures.push(
        `${plugin.name}/skills/${skill.name}: resource "${missing}" is not referenced in SKILL.md — the router table has drifted`
      );
    }

    write(
      path.join(pluginDirectory, "skills", skill.name, "SKILL.md"),
      markdown
    );
    fileCount += 1;

    for (const resource of skill.resources ?? []) {
      write(
        path.join(pluginDirectory, "skills", skill.name, resource.path),
        resource.content
      );
      fileCount += 1;
    }
  }
}

write(path.join(AGENTS_DIR, "hooks.json"), renderJson(HOOKS));
fileCount += 1;

const lessonsPath = path.join(AGENTS_DIR, "lessons.md");

if (!existsSync(lessonsPath)) {
  write(lessonsPath, LESSONS_SEED);
  fileCount += 1;
}

for (const token of findUnresolvedTokens(PLUGINS_DIR)) {
  failures.push(`unresolved {{sections}} token in ${token}`);
}

for (const file of filter(
  readdirSync(PLUGINS_DIR, { recursive: true }),
  isString
)) {
  if (endsWith(file, ".md") || endsWith(file, ".json")) {
    const filePath = path.join(PLUGINS_DIR, file);

    for (const name of findForbiddenStrings(readFileSync(filePath, "utf8"))) {
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
  `Generated ${String(fileCount)} files for ${String(PLUGINS.length)} plugin(s) into ${PLUGINS_DIR}`
);
