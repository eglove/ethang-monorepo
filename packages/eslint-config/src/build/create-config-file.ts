import assign from "lodash/assign.js";
import filter from "lodash/filter.js";
import find from "lodash/find.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
import trimLodash from "lodash/trim.js";
import uniq from "lodash/uniq.js";
import { writeFileSync } from "node:fs";
import path from "node:path";

import type { OutputConfig } from "./output-config.ts";
import type { Plugin } from "./plugin.ts";

import { getLatestReact } from "./get-react-version.ts";

const buildImportList = (output: OutputConfig): string[] => {
  const rawImports: string[] = [
    'import { defineConfig, globalIgnores } from "eslint/config";',
  ];

  if (!isNil(output.includeIgnores) || !isNil(output.includeLanguageOptions)) {
    rawImports.push(
      'import { ignores, languageOptions } from "./constants.js";',
    );
  }

  if (some(output.plugins, (p) => !isNil(p.includeAngularLanguageOptions))) {
    rawImports.push('import { angularLanguageOptions } from "./constants.js";');
  }

  for (const plugin of output.plugins) {
    if (!isNil(plugin.importString)) {
      rawImports.push(...split(plugin.importString, "\n"));
    }

    if (!isNil(plugin.auxiliaryImport)) {
      rawImports.push(plugin.auxiliaryImport);
    }
  }

  if (!isNil(output.extraImports)) {
    rawImports.push(...output.extraImports);
  }

  return uniq(filter(rawImports, Boolean)).toSorted((a, b) => {
    return a.localeCompare(b);
  });
};

const buildConfigBlockOptionals = (
  sorted: Plugin[],
  output: OutputConfig,
  reactSettings: string | undefined,
): string => {
  let optionals = "";

  const hasAngularLang = some(sorted, (p) => {
    return !isNil(p.includeAngularLanguageOptions);
  });

  if (!isNil(output.includeLanguageOptions) && !hasAngularLang) {
    optionals += "\nlanguageOptions,";
  }

  if (hasAngularLang) {
    optionals += "\nlanguageOptions: angularLanguageOptions,";
  }

  const processorPlugin = find(sorted, (p) => !isNil(p.processor));

  if (!isNil(processorPlugin)) {
    optionals += `\nprocessor: ${processorPlugin.processor},`;
  }

  if (!isNil(reactSettings)) {
    optionals += `\nsettings: {\n  ${reactSettings}\n},`;
  }

  return optionals;
};

const buildConfigBlock = (
  files: string,
  plugins: Plugin[],
  output: OutputConfig,
  reactSettings: string | undefined,
): string => {
  const sorted = [...plugins].toSorted((a, b) => {
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const mergedRules: Record<string, unknown> = {};

  for (const plugin of sorted) {
    assign(mergedRules, plugin.rules);

    if (!isNil(plugin.extraRules)) {
      assign(mergedRules, plugin.extraRules);
    }
  }

  const rulesJson = trimLodash(
    JSON.stringify(mergedRules, undefined, 2).slice(2, -1),
  );

  let pluginsString = "";

  for (const plugin of sorted) {
    if (!isNil(plugin.pluginName) && !isNil(plugin.pluginValue)) {
      pluginsString += `"${plugin.pluginName}": ${plugin.pluginValue},`;
    }
  }

  const optionals = buildConfigBlockOptionals(sorted, output, reactSettings);

  const languagePlugin = find(sorted, (p) => !isNil(p.language));

  const languageString = isNil(languagePlugin)
    ? ""
    : `language: "${languagePlugin.language}",`;

  const extraOptions = map(
    filter(sorted, (p) => !isNil(p.extraOptions)),
    (p) => p.extraOptions,
  ).join("\n");

  return `{
    files: ["${files}"],${optionals}${languageString}
    plugins: {
      ${pluginsString}
    },
    rules: {
      ${rulesJson}
    },
    ${extraOptions}
  }`;
};

const buildConfigEntries = (
  output: OutputConfig,
  reactSettings: string | undefined,
): string[] => {
  const configEntries: string[] = [];

  if (!isNil(output.includeIgnores)) {
    configEntries.push("globalIgnores(ignores)");
  }

  if (!isNil(output.globalIgnores) && 0 < output.globalIgnores.length) {
    const ignoreList = map(output.globalIgnores, (g) => `"${g}"`).join(", ");
    configEntries.push(`globalIgnores([${ignoreList}])`);
  }

  const fileGroups = new Map<string, Plugin[]>();

  for (const plugin of output.plugins) {
    const existing = fileGroups.get(plugin.files);

    if (isNil(existing)) {
      fileGroups.set(plugin.files, [plugin]);
    } else {
      existing.push(plugin);
    }
  }

  for (const [files, plugins] of fileGroups) {
    configEntries.push(buildConfigBlock(files, plugins, output, reactSettings));
  }

  if (!isNil(output.extraConfigEntries)) {
    configEntries.push(...output.extraConfigEntries);
  }

  return configEntries;
};

export const createConfigFile = async (output: OutputConfig): Promise<void> => {
  const importList = buildImportList(output);

  let configFile = "// @ts-nocheck\n";

  for (const item of importList) {
    configFile += `${item}\n`;
  }

  let reactSettings: string | undefined;

  if (!isNil(output.includeReactVersion)) {
    const react = await getLatestReact();
    reactSettings = JSON.stringify({
      react: { version: react?.version },
    }).slice(1, -1);
  }

  const configEntries = buildConfigEntries(output, reactSettings);

  configFile += isNil(output.functionParameters)
    ? `\nexport default defineConfig(\n  ${configEntries.join(",\n")}\n);\n`
    : `\nconst config = (${output.functionParameters}) => {\n  return defineConfig(\n    ${configEntries.join(",\n")}\n  );\n}\n\nexport default config;\n`;

  writeFileSync(
    path.join(import.meta.dirname, `../${output.fileName}`),
    configFile,
    "utf8",
  );
};
