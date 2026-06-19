import { generateMarkdown } from "@ethang/markdown-generator/markdown-generator.js";
import endsWith from "lodash/endsWith.js";
import filter from "lodash/filter.js";
import isString from "lodash/isString.js";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { z } from "zod";

import type { RuleDefinition, SkillDefinition } from "./define.ts";

import { ruleMarkdown, skillMarkdown } from "./render.ts";
import {
  checkRuleSize,
  findDuplicateRuleFilenames,
  findForbiddenStrings,
  findUnresolvedTokens,
  validateFrontmatterBlock
} from "./validate.ts";

export type CompilerConfig = {
  manifestPath: string;
  rootDir: string;
  rules: RuleDefinition[];
  rulesDir: string;
  skills?: SkillDefinition[];
  skillsDir?: string;
};

export class CompileError extends Error {
  public failures: string[];

  public constructor(failures: string[], options: ErrorOptions) {
    super(`Compilation failed with ${failures.length} errors.`, options);
    this.name = "CompileError";
    this.failures = failures;
  }
}

export const fsProxy = {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  writeFileSync
};

export const validationHelpers = {
  checkRuleSize,
  findDuplicateRuleFilenames,
  findForbiddenStrings,
  findUnresolvedTokens,
  validateFrontmatterBlock
};

const getDirectoryFiles = (directory: string): string[] | undefined => {
  try {
    return fsProxy.readdirSync(directory);
  } catch {
    return undefined;
  }
};

const cleanFileAndEmptyParents = (
  relativeOrAbsolutePath: string,
  config: CompilerConfig
): void => {
  const filePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.resolve(config.rootDir, relativeOrAbsolutePath);

  if (fsProxy.existsSync(filePath)) {
    fsProxy.rmSync(filePath, { force: true });
  }

  let currentDirectory = path.dirname(filePath);
  const stopDirectories = new Set([
    path.resolve(config.rootDir),
    path.resolve(config.rulesDir)
  ]);

  let shouldContinue = true;
  while (shouldContinue) {
    const resolvedDirectory = path.resolve(currentDirectory);
    if (stopDirectories.has(resolvedDirectory)) {
      shouldContinue = false;
    } else if (fsProxy.existsSync(resolvedDirectory)) {
      const files = getDirectoryFiles(resolvedDirectory);
      if (files === undefined) {
        shouldContinue = false;
      } else if (0 === files.length) {
        fsProxy.rmdirSync(resolvedDirectory);
        currentDirectory = path.dirname(currentDirectory);
      } else {
        shouldContinue = false;
      }
    } else {
      currentDirectory = path.dirname(currentDirectory);
    }
  }
};

const calculateTargetPaths = (config: CompilerConfig): string[] => {
  const rulePaths = Array.from(config.rules, (rule) => {
    return path.join(config.rulesDir, `${rule.filename}.md`);
  });
  const { skills, skillsDir } = config;
  if (undefined === skills || undefined === skillsDir) {
    return rulePaths;
  }
  const skillPaths: string[] = [];
  for (const skill of skills) {
    skillPaths.push(path.join(skillsDir, skill.name, "SKILL.md"));
    const resources = skill.resources ?? [];
    for (const resource of resources) {
      skillPaths.push(
        path.join(skillsDir, skill.name, "resources", resource.filename)
      );
    }
  }
  return [...rulePaths, ...skillPaths];
};

const readManifestContent = (filePath: string): string => {
  try {
    return fsProxy.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
};

const parseJson = (content: string): unknown => {
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
};

const manifestSchema = z.object({
  files: z.array(z.string())
});

const loadManifest = (config: CompilerConfig): string[] => {
  if (fsProxy.existsSync(config.manifestPath)) {
    const content = readManifestContent(config.manifestPath);
    const parsed = parseJson(content);
    const result = manifestSchema.safeParse(parsed);
    if (result.success) {
      return result.data.files;
    }
  }
  return calculateTargetPaths(config);
};

const processRules = (
  config: CompilerConfig,
  failures: string[],
  write: (absolutePath: string, content: string) => void
): void => {
  for (const duplicate of validationHelpers.findDuplicateRuleFilenames(
    config.rules
  )) {
    failures.push(`global rules: duplicate rule filename "${duplicate}"`);
  }

  for (const rule of config.rules) {
    const markdown = ruleMarkdown(rule);
    const size = validationHelpers.checkRuleSize(markdown);

    if ("fail" === size.status) {
      const swebokPath = path.resolve(config.rootDir, "swebok-v4.pdf");
      failures.push(
        `rules/${rule.filename}.md: ${String(size.length)} characters. Rules must be between 10,000 and 12,000 characters. Please reference the SWEBOK v4 PDF at "${swebokPath}" as a priority resource to expand the rule, or use websearch to find industry standard knowledge.`
      );
    }

    if (!validationHelpers.validateFrontmatterBlock(markdown)) {
      failures.push(`rules/${rule.filename}.md: malformed frontmatter block`);
    }

    write(path.join(config.rulesDir, `${rule.filename}.md`), markdown);
  }
};

const processSkills = (
  config: CompilerConfig,
  failures: string[],
  write: (absolutePath: string, content: string) => void
): void => {
  const { skills, skillsDir } = config;
  if (undefined === skills || undefined === skillsDir) {
    return;
  }
  for (const skill of skills) {
    const markdown = skillMarkdown(skill);

    if (!validationHelpers.validateFrontmatterBlock(markdown)) {
      failures.push(
        `skills/${skill.name}/SKILL.md: malformed frontmatter block`
      );
    }

    write(path.join(skillsDir, skill.name, "SKILL.md"), markdown);

    const resources = skill.resources ?? [];
    for (const resource of resources) {
      const resourceContent = isString(resource.content)
        ? resource.content
        : generateMarkdown({ blocks: resource.content });
      write(
        path.join(skillsDir, skill.name, "resources", resource.filename),
        resourceContent
      );
    }
  }
};

const validateFileContent = (filePath: string, failures: string[]): void => {
  const fileContent = fsProxy.readFileSync(filePath, "utf8");
  for (const name of validationHelpers.findForbiddenStrings(fileContent)) {
    failures.push(
      `forbidden source-workspace reference "${name}" in ${filePath}`
    );
  }
};

const scanDirectories = (config: CompilerConfig, failures: string[]): void => {
  const directoriesToScan = [config.rulesDir];
  const { skills, skillsDir } = config;
  if (undefined !== skills && undefined !== skillsDir) {
    for (const skill of skills) {
      directoriesToScan.push(path.join(skillsDir, skill.name));
    }
  }

  for (const directory of directoriesToScan) {
    if (fsProxy.existsSync(directory)) {
      for (const token of validationHelpers.findUnresolvedTokens(directory)) {
        failures.push(`unresolved {{sections}} token in ${token}`);
      }

      const files = filter(
        fsProxy.readdirSync(directory, { recursive: true }),
        isString
      );
      const targetFiles = filter(files, (file) => {
        return endsWith(file, ".md") || endsWith(file, ".json");
      });

      for (const file of targetFiles) {
        validateFileContent(path.join(directory, file), failures);
      }
    }
  }
};

export const compile = (config: CompilerConfig): void => {
  const filesToClean = loadManifest(config);

  for (const file of filesToClean) {
    cleanFileAndEmptyParents(file, config);
  }

  const failures: string[] = [];
  const generatedFiles: string[] = [];

  const write = (absolutePath: string, content: string) => {
    fsProxy.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fsProxy.writeFileSync(absolutePath, content, "utf8");
    generatedFiles.push(
      path.relative(config.rootDir, absolutePath).replaceAll("\\", "/")
    );
  };

  processRules(config, failures, write);
  processSkills(config, failures, write);
  scanDirectories(config, failures);

  if (0 < failures.length) {
    throw new CompileError(failures, {});
  }

  fsProxy.mkdirSync(path.dirname(config.manifestPath), { recursive: true });
  fsProxy.writeFileSync(
    config.manifestPath,
    JSON.stringify({ files: generatedFiles }, null, 2),
    "utf8"
  );
};
