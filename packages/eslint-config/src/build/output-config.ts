import groupBy from "lodash/groupBy.js";
import sumBy from "lodash/sumBy.js";

import type { Plugin } from "./plugin.ts";

import { a11yPlugin } from "../setup/a11y.ts";
import { angularTemplatePlugin, angularTsPlugin } from "../setup/angular.ts";
import { astroPlugin } from "../setup/astro.ts";
import { compatPlugin } from "../setup/compat.ts";
import { cspellPlugin } from "../setup/cspell.ts";
import { cssPlugin } from "../setup/css.ts";
import { eslintPlugin } from "../setup/eslint.ts";
import { htmlPlugin } from "../setup/html.ts";
import { json5Plugin, jsoncPlugin, jsonPlugin } from "../setup/json.ts";
import { lodashPlugin } from "../setup/lodash.ts";
import { markdownPlugin } from "../setup/markdown.ts";
import { perfectionistPlugin } from "../setup/perfectionist.ts";
import { reactHooksPlugin, reactPlugin } from "../setup/react.ts";
import { solidPlugin } from "../setup/solid.ts";
import { sonarPlugin } from "../setup/sonar.ts";
import { storybookPlugin } from "../setup/storybook.ts";
import { tailwindPlugin } from "../setup/tailwind.ts";
import { tanstackQueryPlugin } from "../setup/tanstack-query.ts";
import { tanstackRouterPlugin } from "../setup/tanstack-router.ts";
import { typescriptPlugin } from "../setup/typescript-eslint.ts";
import { unicornPlugin } from "../setup/unicorn.ts";
import { vitestPlugin } from "../setup/vitest.ts";

export type OutputConfigOptions = {
  extraConfigEntries?: string[];
  extraImports?: string[];
  fileName: string;
  functionParameters?: string;
  globalIgnores?: string[];
  includeIgnores?: boolean;
  includeLanguageOptions?: boolean;
  includeReactVersion?: boolean;
  plugins: Plugin[];
  readmeImport?: string;
  readmeLabel?: string;
};

export class OutputConfig {
  public readonly extraConfigEntries?: string[];
  public readonly extraImports?: string[];
  public readonly fileName: string;
  public readonly functionParameters?: string;
  public readonly globalIgnores?: string[];
  public readonly includeIgnores?: boolean;
  public readonly includeLanguageOptions?: boolean;
  public readonly includeReactVersion?: boolean;
  public readonly plugins: Plugin[];
  public readonly readmeImport?: string;
  public readonly readmeLabel?: string;

  public get pluginsByFiles(): Record<string, Plugin[]> {
    return groupBy(this.plugins, (plugin) => plugin.files);
  }

  public get ruleCount(): number {
    return sumBy(this.plugins, (plugin) => plugin.ruleCount);
  }

  public constructor(options: OutputConfigOptions) {
    this.extraConfigEntries = options.extraConfigEntries;
    this.extraImports = options.extraImports;
    this.fileName = options.fileName;
    this.functionParameters = options.functionParameters;
    this.globalIgnores = options.globalIgnores;
    this.includeIgnores = options.includeIgnores;
    this.includeLanguageOptions = options.includeLanguageOptions;
    this.includeReactVersion = options.includeReactVersion;
    this.plugins = options.plugins;
    this.readmeImport = options.readmeImport;
    this.readmeLabel = options.readmeLabel;
  }
}

export const outputConfigs: OutputConfig[] = [
  new OutputConfig({
    extraConfigEntries: [
      "eslintConfigPrettier",
      "eslintPluginPrettierRecommended",
    ],
    extraImports: [
      'import eslintConfigPrettier from "eslint-config-prettier";',
      'import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";',
    ],
    fileName: "config.main.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    includeReactVersion: true,
    plugins: [
      compatPlugin,
      eslintPlugin,
      typescriptPlugin,
      unicornPlugin,
      lodashPlugin,
      sonarPlugin,
      perfectionistPlugin,
      tanstackQueryPlugin,
      tanstackRouterPlugin,
      a11yPlugin,
      cspellPlugin,
      markdownPlugin,
      cssPlugin,
      jsonPlugin,
      jsoncPlugin,
      json5Plugin,
    ],
  }),
  new OutputConfig({
    fileName: "config.html.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [htmlPlugin],
    readmeImport:
      'import htmlConfig from "@ethang/eslint-config/config.html.js";',
    readmeLabel: "HTML",
  }),
  new OutputConfig({
    fileName: "config.astro.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [astroPlugin],
    readmeImport:
      'import astroConfig from "@ethang/eslint-config/config.astro.js";',
    readmeLabel: "Astro",
  }),
  new OutputConfig({
    fileName: "config.react.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    includeReactVersion: true,
    plugins: [reactPlugin, reactHooksPlugin],
    readmeImport:
      'import reactConfig from "@ethang/eslint-config/config.react.js";',
    readmeLabel: "React",
  }),
  new OutputConfig({
    fileName: "config.solid.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [solidPlugin],
    readmeImport:
      'import solidConfig from "@ethang/eslint-config/config.solid.js";',
    readmeLabel: "Solid",
  }),
  new OutputConfig({
    fileName: "config.angular.js",
    globalIgnores: ["**/*.spec.ts", "src/main.server.ts"],
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [angularTsPlugin, angularTemplatePlugin],
    readmeImport:
      'import angularConfig from "@ethang/eslint-config/config.angular.js";',
    readmeLabel: "Angular",
  }),
  new OutputConfig({
    fileName: "config.storybook.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [storybookPlugin],
    readmeImport:
      'import storybookConfig from "@ethang/eslint-config/config.storybook.js";',
    readmeLabel: "Storybook",
  }),
  new OutputConfig({
    fileName: "config.tailwind.js",
    functionParameters: "/** @type {string} */ pathToConfig",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [tailwindPlugin],
    readmeImport:
      'import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";',
    readmeLabel: "Tailwind",
  }),
  new OutputConfig({
    fileName: "config.vitest.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [vitestPlugin],
    readmeImport:
      'import vitestConfig from "@ethang/eslint-config/config.vitest.js";',
    readmeLabel: "Vitest",
  }),
];
