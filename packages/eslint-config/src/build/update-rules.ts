import type { ConfigOptions } from "./create-config.ts";

import { createConfigFile } from "./create-config-file.ts";

export type ConfigFile = {
  importString?: string;
  label?: string;
  name: string;
  options?: ConfigOptions;
};

export const coreFile = [
  {
    importString: 'import config from "@ethang/eslint-config/eslint.config.js',
    label: "Core",
    name: "core",
    options: {
      extraImports: ['import { fixupPluginRules } from "@eslint/compat";'], // TODO remove with v9 compat
      includeIgnores: true,
      includeLanguageOptions: true,
      includeReactVersion: true,
    },
  },
  {
    name: "markdown",
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
      extraImports: ['import tseslint from "typescript-eslint";'],
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
      extraImports: ['import tseslint from "typescript-eslint";'],
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
      extraImports: ['import tseslint from "typescript-eslint";'],
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
      extraImports: [
        'import tseslint from "typescript-eslint";',
        'import angular from "angular-eslint";',
      ],
      includeIgnores: true,
      includeLanguageOptions: true,
      globalIgnores: ["**/*.spec.ts", "src/main.server.ts"],
      processor: "angular.processInlineTemplates",
    },
  },
  {
    name: "angular:template",
    options: {
      extraImports: ['import { angularLanguageOptions } from "./constants.js"'],
      includeLanguageOptions: false,
      includeAngularLanguageOptions: true,
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
  ]);
};

await updateRules();
