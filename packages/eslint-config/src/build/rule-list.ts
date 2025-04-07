import { a11yRules } from "../setup/a11y.ts";
import { angularTemplateRules, angularTsRules } from "../setup/angular.js";
import { astroRules } from "../setup/astro.ts";
import { barrelRules } from "../setup/barrel.ts";
import { compatRules } from "../setup/compat.ts";
import { cspellRules } from "../setup/cspell.js";
import { cssRules } from "../setup/css.js";
import { dependRules } from "../setup/depend.ts";
import { eslintRules } from "../setup/eslint.ts";
import { jsonRules } from "../setup/json.ts";
import { lodashRules } from "../setup/lodash.ts";
import { markdownRules } from "../setup/markdown.ts";
import { perfectionistRules } from "../setup/perfectionist.ts";
import {
  reactCompilerRules,
  reactHookRules,
  reactRules,
} from "../setup/react.ts";
import { solidRules } from "../setup/solid.ts";
import { sonarRules } from "../setup/sonar.ts";
import { storybookRules } from "../setup/storybook.js";
import { tanstackQueryRules } from "../setup/tanstack-query.ts";
import { tanstackRouterRules } from "../setup/tanstack-router.js";
import { typescriptRules } from "../setup/typescript-eslint.ts";
import { unicornRules } from "../setup/unicorn.ts";

const eslintJson = "@eslint/json";
const eslintJsonGithub = "https://github.com/eslint/json";

export const ruleList = [
  {
    importString: 'import depend from "eslint-plugin-depend";',
    list: dependRules,
    name: "eslint-plugin-depend",
    order: 0,
    pluginName: "depend",
    pluginValue: "depend",
    type: "core",
    url: "https://github.com/es-tooling/eslint-plugin-depend/tree/main",
  },
  {
    importString: 'import barrel from "eslint-plugin-barrel-files";',
    list: barrelRules,
    name: "eslint-plugin-barrel-files",
    order: 1,
    pluginName: "barrel",
    pluginValue: "barrel",
    type: "core",
    url: "https://github.com/thepassle/eslint-plugin-barrel-files",
  },
  {
    importString: 'import compat from "eslint-plugin-compat";',
    list: compatRules,
    name: "eslint-plugin-compat",
    order: 2,
    pluginName: "compat",
    pluginValue: "compat",
    type: "core",
    url: "https://github.com/amilajack/eslint-plugin-compat",
  },
  {
    importString: undefined,
    list: eslintRules,
    name: "@eslint/js",
    order: 3,
    pluginName: undefined,
    pluginValue: undefined,
    type: "core",
    url: "https://github.com/eslint/eslint/tree/main/packages/js",
  },
  {
    importString: 'import tseslint from "typescript-eslint";',
    list: typescriptRules,
    name: "@typescript/eslint",
    order: 4,
    pluginName: "@typescript-eslint",
    pluginValue: "tseslint.plugin",
    type: "core",
    url: "https://github.com/typescript-eslint/typescript-eslint",
  },
  {
    importString: 'import unicorn from "eslint-plugin-unicorn";',
    list: unicornRules,
    name: "sindresorhus/eslint-plugin-unicorn",
    order: 5,
    pluginName: "unicorn",
    pluginValue: "unicorn",
    type: "core",
    url: "https://github.com/sindresorhus/eslint-plugin-unicorn",
  },
  {
    importString: 'import lodashConfig from "eslint-plugin-lodash";',
    list: lodashRules,
    name: "eslint-plugin-lodash",
    order: 6,
    pluginName: "lodash",
    pluginValue: "lodashConfig",
    type: "core",
    url: "https://github.com/wix-incubator/eslint-plugin-lodash",
  },
  {
    importString: 'import sonar from "eslint-plugin-sonarjs";',
    list: sonarRules,
    name: "eslint-plugin-sonarjs",
    order: 7,
    pluginName: "sonar",
    pluginValue: "sonar", // TODO remove with v9 compat
    type: "core",
    url: "https://github.com/SonarSource/SonarJS/blob/master/packages/jsts/src/rules/README.md",
  },
  // {
  //   importString: 'import tailwind from "eslint-plugin-tailwindcss";',
  //   list: tailwindRules,
  //   name: "eslint-plugin-tailwindcss",
  //   order: 8,
  //   pluginName: "tailwind",
  //   pluginValue: "tailwind",
  //   type: "core",
  //   url: "https://github.com/francoismassart/eslint-plugin-tailwindcss",
  // },
  {
    importString: 'import perfectionist from "eslint-plugin-perfectionist";',
    list: perfectionistRules,
    name: "eslint-plugin-perfectionist",
    order: 9,
    pluginName: "perfectionist",
    pluginValue: "perfectionist",
    type: "core",
    url: "https://github.com/azat-io/eslint-plugin-perfectionist",
  },
  {
    importString: 'import tanstackQuery from "@tanstack/eslint-plugin-query";',
    list: tanstackQueryRules,
    name: "@tanstack/eslint-plugin-query",
    order: 10,
    pluginName: "@tanstack/query",
    pluginValue: "tanstackQuery",
    type: "core",
    url: "https://tanstack.com/query/latest/docs/eslint/eslint-plugin-query",
  },
  {
    importString:
      'import tanstackRouter from "@tanstack/eslint-plugin-router";',
    list: tanstackRouterRules,
    name: "@tanstack/eslint-plugin-router",
    order: 11,
    pluginName: "@tanstack/router",
    pluginValue: "tanstackRouter",
    type: "core",
    url: "https://tanstack.com/router/latest/docs/eslint/eslint-plugin-router",
  },
  {
    importString: 'import a11y from "eslint-plugin-jsx-a11y";',
    list: a11yRules,
    name: "jsx-a11y",
    order: 12,
    pluginName: "a11y",
    pluginValue: "a11y",
    type: "core",
    url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y",
  },
  {
    importString: 'import cspell from "@cspell/eslint-plugin";',
    list: cspellRules,
    name: "@cspell/eslint-plugin",
    order: 13,
    pluginName: "cspell",
    pluginValue: "cspell",
    type: "core",
    url: "https://github.com/streetsidesoftware/cspell/tree/main/packages/cspell-eslint-plugin",
  },
  {
    importString: "import css from '@eslint/css';",
    list: cssRules,
    name: "@eslint/css",
    order: 0,
    pluginName: "css",
    pluginValue: "css",
    type: "css",
    url: "https://github.com/eslint/css",
  },
  {
    importString: 'import markdown from "@eslint/markdown";',
    list: markdownRules,
    name: "@eslint/markdown",
    order: 0,
    pluginName: "markdown",
    pluginValue: "markdown",
    type: "markdown",
    url: "https://github.com/eslint/markdown",
  },
  {
    importString: `import json from "${eslintJson}";`,
    list: jsonRules,
    name: eslintJson,
    order: 0,
    pluginName: "json",
    pluginValue: "json",
    type: "json",
    url: eslintJsonGithub,
  },
  {
    list: jsonRules,
    name: eslintJson,
    order: 0,
    pluginName: "json",
    pluginValue: "json",
    type: "jsonc",
    url: eslintJsonGithub,
  },
  {
    list: jsonRules,
    name: eslintJson,
    order: 0,
    pluginName: "json",
    pluginValue: "json",
    type: "json5",
    url: eslintJsonGithub,
  },
  {
    importString: 'import astro from "eslint-plugin-astro";',
    list: astroRules,
    name: "eslint-plugin-astro",
    pluginName: "astro",
    pluginValue: "astro",
    type: "astro",
    url: "https://github.com/ota-meshi/eslint-plugin-astro",
  },
  {
    importString: 'import react from "@eslint-react/eslint-plugin";',
    list: reactRules,
    name: "@eslint-react/eslint-plugin",
    pluginName: "react",
    pluginValue: "react",
    type: "react",
    url: "https://eslint-react.xyz/",
  },
  {
    importString: 'import reactHooks from "eslint-plugin-react-hooks";',
    list: reactHookRules,
    name: "eslint-plugin-react-hooks",
    pluginName: "react-hooks",
    pluginValue: "reactHooks",
    type: "react",
    url: "https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks",
  },
  {
    importString: 'import reactCompiler from "eslint-plugin-react-compiler";',
    list: reactCompilerRules,
    name: "eslint-plugin-react-compiler",
    pluginName: "react-compiler",
    pluginValue: "reactCompiler",
    type: "react",
    url: "https://github.com/facebook/react/tree/main/compiler/packages/eslint-plugin-react-compiler",
  },
  {
    importString: 'import solid from "eslint-plugin-solid";',
    list: solidRules,
    name: "eslint-plugin-solid",
    pluginName: "solid",
    pluginValue: "solid",
    type: "solid",
    url: "https://github.com/solidjs-community/eslint-plugin-solid",
  },
  {
    importString: 'import angularTS from "@angular-eslint/eslint-plugin";',
    list: angularTsRules,
    name: "@angular-eslint/eslint-plugin",
    pluginName: "@angular-eslint",
    pluginValue: "angularTS",
    type: "angular",
    url: "https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/README.md",
  },
  {
    importString:
      'import angularTemplate from "@angular-eslint/eslint-plugin-template";',
    list: angularTemplateRules,
    name: "@angular-eslint/eslint-plugin-template",
    pluginName: "@angular-eslint/template",
    pluginValue: "angularTemplate",
    type: "angular:template",
    url: "https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/README.md",
  },
  {
    importString: 'import storybook from "eslint-plugin-storybook";',
    list: storybookRules,
    name: "eslint-plugin-storybook",
    pluginName: "storybook",
    pluginValue: "storybook",
    type: "storybook",
    url: "https://github.com/storybookjs/eslint-plugin-storybook",
  },
];
