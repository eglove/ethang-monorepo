import type { ConfigOptions } from "./create-config.ts";

import { createConfigFile } from "./create-config-file.ts";

export type ConfigFile = {
  importString?: string;
  label?: string;
  name: string;
  options?: ConfigOptions;
};

const importTsEslint = 'import tseslint from "typescript-eslint";';

export const coreFile = [
  {
    importString: 'import config from "@ethang/eslint-config/eslint.config.js',
    label: "Core",
    name: "core",
    options: {
      extraImports: [
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
    name: "html",
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

const astroFile = [
  {
    importString:
      'import astroConfig from "@ethang/eslint-config/config.astro.ts',
    label: "Astro",
    name: "astro",
    options: {
      extraImports: [importTsEslint],
      includeIgnores: true,
      includeLanguageOptions: true,
    },
  },
];

const reactFile = [
  {
    importString:
      'import reactConfig from "@ethang/eslint-config/config.react.ts',
    label: "React",
    name: "react",
    options: {
      extraImports: [importTsEslint],
      includeIgnores: true,
      includeLanguageOptions: true,
      includeReactVersion: true,
    },
  },
];

const solidFile = [
  {
    importString:
      'import solidConfig from "@ethang/eslint-config/config.solid.ts',
    label: "Solid",
    name: "solid",
    options: {
      extraImports: [importTsEslint],
      includeIgnores: true,
      includeLanguageOptions: true,
    },
  },
];

const angularFile = [
  {
    importString:
      'import angularConfig from "@ethang/eslint-config/config.angular.ts',
    label: "Angular",
    name: "angular",
    options: {
      extraImports: [importTsEslint, 'import angular from "angular-eslint";'],
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
      'import storybookConfig from "@ethang/eslint-config/config.storybook.ts',
    label: "Storybook",
    name: "storybook",
    options: {
      extraImports: [importTsEslint],
      includeIgnores: true,
      includeLanguageOptions: true,
    },
  },
];

const tailwindFile = [
  {
    importString:
      'import tailwindConfig from "@ethang/eslint-config/config.tailwind.ts',
    label: "Tailwind",
    name: "tailwind",
    options: {
      extraImports: [importTsEslint],
      extraOptions: "settings: { tailwindcss: { config: pathToConfig } },",
      includeIgnores: true,
      includeLanguageOptions: true,
    },
  },
];

export const updateRules = async () => {
  await Promise.all([
    createConfigFile(coreFile, "eslint.config.js"),
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

await updateRules();
