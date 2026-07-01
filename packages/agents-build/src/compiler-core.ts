import { generateMarkdown } from "@ethang/markdown-generator/markdown-generator.js";
import filter from "lodash/filter.js";
import isArray from "lodash/isArray.js";
import isObject from "lodash/isObject.js";
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

import type { RuleDefinition, SkillDefinition } from "./define.ts";

import { ruleMarkdown, skillMarkdown } from "./render.ts";
import {
  findDuplicateRuleFilenames,
  findUnresolvedTokens,
  isValidFrontmatterBlock
} from "./validate.ts";

export type CompilerConfig = {
  hooksPath?: string;
  manifestPath?: string;
  mcpPublicPath?: string;
  rootDir: string;
  rules: RuleDefinition[];
  rulesDir: string;
  skills?: SkillDefinition[];
  skillsDir?: string;
};

export type McpConfig = {
  mcpServers: Record<string, McpServerConfig>;
};

export type McpServerConfig =
  | { args: string[]; command: string }
  | { type?: "http" | "sse"; url: string };

export const MCP_SERVERS: McpConfig = {
  mcpServers: {
    mdn: {
      type: "http",
      url: "https://mcp.mdn.mozilla.net/"
    },
    webstorm: {
      type: "sse",
      url: "http://127.0.0.1:64506/sse"
    }
  }
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
  findDuplicateRuleFilenames,
  findUnresolvedTokens,
  isValidFrontmatterBlock
};

const processMcpConfig = (
  config: CompilerConfig,
  write: (absolutePath: string, content: string) => void
): void => {
  if (undefined === config.mcpPublicPath) {
    return;
  }

  write(config.mcpPublicPath, JSON.stringify(MCP_SERVERS, null, 2));
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

    if (!validationHelpers.isValidFrontmatterBlock(markdown)) {
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

    if (!validationHelpers.isValidFrontmatterBlock(markdown)) {
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

const scanDirectory = (directory: string, failures: string[]): void => {
  const isExists = fsProxy.existsSync(directory);

  if (!isExists) {
    return;
  }

  for (const token of validationHelpers.findUnresolvedTokens(directory)) {
    failures.push(`unresolved {{sections}} token in ${token}`);
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
    scanDirectory(directory, failures);
  }
};

const loadManifest = (config: CompilerConfig): string[] => {
  if (config.manifestPath === undefined) {
    return [];
  }
  try {
    return parseManifestContent(
      fsProxy.readFileSync(config.manifestPath, "utf8")
    );
  } catch {
    return [];
  }
};

const parseManifestContent = (content: string): string[] => {
  const parsed: unknown = JSON.parse(content);
  if (isObject(parsed) && "files" in parsed) {
    const { files } = parsed;
    if (isArray(files)) {
      return filter(files, isString);
    }
  }
  return [];
};

const canRemoveDirectory = (directory: string): boolean => {
  try {
    return 0 === fsProxy.readdirSync(directory).length;
  } catch {
    return false;
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
  if (config.skillsDir !== undefined) {
    stopDirectories.add(path.resolve(config.skillsDir));
  }

  let shouldContinue = true;
  while (shouldContinue) {
    const resolvedDirectory = path.resolve(currentDirectory);
    if (stopDirectories.has(resolvedDirectory)) {
      shouldContinue = false;
    } else if (canRemoveDirectory(resolvedDirectory)) {
      fsProxy.rmdirSync(resolvedDirectory);
      currentDirectory = path.dirname(currentDirectory);
    } else {
      shouldContinue = false;
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
  processMcpConfig(config, write);
  scanDirectories(config, failures);

  if (0 < failures.length) {
    throw new CompileError(failures, {});
  }

  if (config.manifestPath !== undefined) {
    fsProxy.mkdirSync(path.dirname(config.manifestPath), { recursive: true });
    fsProxy.writeFileSync(
      config.manifestPath,
      JSON.stringify({ files: generatedFiles }, null, 2),
      "utf8"
    );
  }
};
