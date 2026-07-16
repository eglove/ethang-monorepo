import groupBy from "lodash/groupBy.js";
import sumBy from "lodash/sumBy.js";

import type { Plugin } from "./plugin.ts";

import { a11yPlugin } from "../setup/a11y.ts";
import { angularTemplatePlugin, angularTsPlugin } from "../setup/angular.ts";
import { astroPlugin } from "../setup/astro.ts";
import { compatPlugin } from "../setup/compat.ts";
import { cssPlugin } from "../setup/css.ts";
import { eslintPlugin } from "../setup/eslint.ts";
import { ethangPluginConfig } from "../setup/ethang-plugin.ts";
import { htmlPlugin } from "../setup/html.ts";
import { json5Plugin, jsoncPlugin, jsonPlugin } from "../setup/json.ts";
import { markdownPlugin } from "../setup/markdown.ts";
import { perfectionistPlugin } from "../setup/perfectionist.ts";
import { playwrightPlugin } from "../setup/playwright.ts";
import { prettierPlugin } from "../setup/prettier.ts";
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
  extraConfigEntries?: null | string[];
  extraImports?: null | string[];
  fileName: string;
  functionParameters?: null | string;
  globalIgnores?: null | string[];
  includeIgnores?: boolean | null;
  includeLanguageOptions?: boolean | null;
  includeReactVersion?: boolean | null;
  plugins: Plugin[];
  readmeImport?: null | string;
  readmeLabel?: null | string;
};

export class OutputConfig {
  public readonly extraConfigEntries: null | string[];
  public readonly extraImports: null | string[];
  public readonly fileName: string;
  public readonly functionParameters: null | string;
  public readonly globalIgnores: null | string[];
  public readonly includeIgnores: boolean | null;
  public readonly includeLanguageOptions: boolean | null;
  public readonly includeReactVersion: boolean | null;
  public readonly plugins: Plugin[];
  public readonly readmeImport: null | string;
  public readonly readmeLabel: null | string;

  public get pluginsByFiles() {
    return groupBy(this.plugins, "files");
  }

  public get ruleCount() {
    return sumBy(this.plugins, "ruleCount");
  }

  public constructor(options: OutputConfigOptions) {
    this.extraConfigEntries = options.extraConfigEntries ?? null;
    this.extraImports = options.extraImports ?? null;
    this.fileName = options.fileName;
    this.functionParameters = options.functionParameters ?? null;
    this.globalIgnores = options.globalIgnores ?? null;
    this.includeIgnores = options.includeIgnores ?? null;
    this.includeLanguageOptions = options.includeLanguageOptions ?? null;
    this.includeReactVersion = options.includeReactVersion ?? null;
    this.plugins = options.plugins;
    this.readmeImport = options.readmeImport ?? null;
    this.readmeLabel = options.readmeLabel ?? null;
  }
}

export const outputConfigs: OutputConfig[] = [
  new OutputConfig({
    extraConfigEntries: [
      `{
    files: [
      "**/*.test.{ts,tsx,js,jsx,mjs,cjs}",
      "**/*.spec.{ts,tsx,js,jsx,mjs,cjs}"
    ],
    rules: {
      "@ethang/no-try-catch": "off",
      "@ethang/prefer-effect-log": "off",
      "@ethang/validate-unknown": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-type-assertion": "off",
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/prefer-promise-reject-errors": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/strict-void-return": "off",
      "@typescript-eslint/unbound-method": "off",
      "no-restricted-syntax": "off",
      "no-undefined": "off",
      "sonar/function-name": "off",
      "sonar/variable-name": "off",
      "unicorn/consistent-function-scoping": "off",
      "unicorn/max-nested-calls": "off",
      "unicorn/no-global-object-property-assignment": "off",
      "unicorn/no-immediate-mutation": "off"
    }
  }`
    ],
    extraImports: [],
    fileName: "config.main.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    includeReactVersion: true,
    plugins: [
      compatPlugin,
      eslintPlugin,
      typescriptPlugin,
      unicornPlugin,
      ethangPluginConfig,
      sonarPlugin,
      perfectionistPlugin,
      tanstackQueryPlugin,
      tanstackRouterPlugin,
      a11yPlugin,
      markdownPlugin,
      cssPlugin,
      jsonPlugin,
      jsoncPlugin,
      json5Plugin,
      prettierPlugin
    ] as const
  }),
  new OutputConfig({
    fileName: "config.html.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [htmlPlugin],
    readmeImport:
      'import htmlConfig from "@ethang/eslint-config/config.html.js";',
    readmeLabel: "HTML"
  }),
  new OutputConfig({
    fileName: "config.astro.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [astroPlugin] as const,
    readmeImport:
      'import astroConfig from "@ethang/eslint-config/config.astro.js";',
    readmeLabel: "Astro"
  }),
  new OutputConfig({
    fileName: "config.react.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    includeReactVersion: true,
    plugins: [reactPlugin, reactHooksPlugin] as const,
    readmeImport:
      'import reactConfig from "@ethang/eslint-config/config.react.js";',
    readmeLabel: "React"
  }),
  new OutputConfig({
    fileName: "config.solid.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [solidPlugin] as const,
    readmeImport:
      'import solidConfig from "@ethang/eslint-config/config.solid.js";',
    readmeLabel: "Solid"
  }),
  new OutputConfig({
    fileName: "config.angular.js",
    globalIgnores: ["**/*.spec.ts", "src/main.server.ts"],
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [angularTsPlugin, angularTemplatePlugin],
    readmeImport:
      'import angularConfig from "@ethang/eslint-config/config.angular.js";',
    readmeLabel: "Angular"
  }),
  new OutputConfig({
    fileName: "config.storybook.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [storybookPlugin] as const,
    readmeImport:
      'import storybookConfig from "@ethang/eslint-config/config.storybook.js";',
    readmeLabel: "Storybook"
  }),
  new OutputConfig({
    fileName: "config.tailwind.js",
    functionParameters: "/** @type {string} */ pathToConfig",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [tailwindPlugin] as const,
    readmeImport:
      'import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";',
    readmeLabel: "Tailwind"
  }),
  new OutputConfig({
    fileName: "config.vitest.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [vitestPlugin] as const,
    readmeImport:
      'import vitestConfig from "@ethang/eslint-config/config.vitest.js";',
    readmeLabel: "Vitest"
  }),
  new OutputConfig({
    fileName: "config.playwright.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [playwrightPlugin] as const,
    readmeImport: 'import playwright from "eslint-plugin-playwright";',
    readmeLabel: "Playwright"
  })
];
