import type { ConfigOptions } from "./create-config.ts";

import { createConfigFile } from "./create-config-file.ts";

export type ConfigFile = {
  importString?: string;
  label?: string;
  name: string;
  options?: ConfigOptions;
};

const defineConfig = 'import { defineConfig } from "eslint/config";';

export const coreFile = [
  {
    importString: 'import config from "@ethang/eslint-config/config.main.js";',
    label: "Core",
    name: "core",
    options: {
      extraImports: [
        defineConfig,
        'import eslintConfigPrettier from "eslint-config-prettier";',
        'import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";',
      ],
      includeIgnores: true,
      includeLanguageOptions: true,
      includeReactVersion: true,
    },
  },
  {
    name: "markdown",
  },
  {
    name: "css",
  },
  {
    name: "json",
  },
  {
    name: "jsonc",
  },
  {
    name: "json5",
  },
];

export const htmlFile = [
  {
    importString: 'import html from "@html-eslint/eslint-plugin";',
    label: "HTML",
    name: "html",
    options: {
      extraImports: [defineConfig],
      extraRules: { "prettier/prettier": "off" },
      includeIgnores: true,
      includeLanguageOptions: true,
    },
  },
];

const astroFile = [
  {
    importString:
      'import astroConfig from "@ethang/eslint-config/config.astro.js";',
    label: "Astro",
    name: "astro",
    options: {
      extraImports: [defineConfig],
      includeIgnores: true,
      includeLanguageOptions: true,
    },
  },
];

const reactFile = [
  {
    importString:
      'import reactConfig from "@ethang/eslint-config/config.react.js";',
    label: "React",
    name: "react",
    options: {
      extraImports: [defineConfig],
      includeIgnores: true,
      includeLanguageOptions: true,
      includeReactVersion: true,
    },
  },
];

const solidFile = [
  {
    importString:
      'import solidConfig from "@ethang/eslint-config/config.solid.js";',
    label: "Solid",
    name: "solid",
    options: {
      extraImports: [defineConfig],
      includeIgnores: true,
      includeLanguageOptions: true,
    },
  },
];

const angularFile = [
  {
    importString:
      'import angularConfig from "@ethang/eslint-config/config.angular.js";',
    label: "Angular",
    name: "angular",
    options: {
      extraImports: [defineConfig, 'import angular from "angular-eslint";'],
      globalIgnores: ["**/*.spec.ts", "src/main.server.ts"],
      includeIgnores: true,
      includeLanguageOptions: true,
      processor: "angular.processInlineTemplates",
    },
  },
  {
    name: "angular:template",
    options: {
      extraImports: ['import { angularLanguageOptions } from "./constants.js"'],
      includeAngularLanguageOptions: true,
      includeLanguageOptions: false,
    },
  },
];

const storybookFile = [
  {
    importString:
      'import storybookConfig from "@ethang/eslint-config/config.storybook.js";',
    label: "Storybook",
    name: "storybook",
    options: {
      extraImports: [defineConfig],
      includeIgnores: true,
      includeLanguageOptions: true,
    },
  },
];

const tailwindFile = [
  {
    importString:
      'import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";',
    label: "Tailwind",
    name: "tailwind",
    options: {
      extraImports: [defineConfig],
      extraOptions: "settings: { tailwindcss: { config: pathToConfig } },",
      includeIgnores: true,
      includeLanguageOptions: true,
    },
  },
];

export const updateRules = async () => {
  await Promise.all([
    createConfigFile(coreFile, "config.main.js"),
    createConfigFile(htmlFile, "config.html.js"),
    createConfigFile(astroFile, "config.astro.js"),
    createConfigFile(reactFile, "config.react.js"),
    createConfigFile(solidFile, "config.solid.js"),
    createConfigFile(angularFile, "config.angular.js"),
    createConfigFile(storybookFile, "config.storybook.js"),
    createConfigFile(
      tailwindFile,
      "config.tailwind.js",
      "/** @type {string} */ pathToConfig",
    ),
  ]);
};

/* v8 ignore start */
if (process.argv[1] === import.meta.filename) {
  await updateRules();
}
/* v8 ignore stop */
