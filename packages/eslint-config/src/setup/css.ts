import css from "@eslint/css";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.js";

const ruleNames = keys(getNonDeprecatedRules(css.rules));

export const cssRules = genRules(
  ruleNames,
  [
    { name: "no-invalid-at-rules", rule: "off" },
    { name: "use-baseline", rule: ["error", { available: "newly" }] },
    { name: "use-layers", rule: "off" }
  ],
  "css"
);

export const cssPlugin = new Plugin({
  files: "**/*.css",
  importString: "import css from '@eslint/css';",
  language: "css/css",
  name: "@eslint/css",
  order: 0,
  pluginName: "css",
  pluginValue: "css",
  rules: cssRules,
  url: "https://github.com/eslint/css"
});

// The unicorn rule is a JS-AST rule; registering it on the CSS block lets ESLint run it
// against CSS files parsed by @eslint/css. It is turned off for JS/TS in unicorn.ts.
export const unicornViewportPlugin = new Plugin({
  files: "**/*.css",
  importString: 'import unicorn from "eslint-plugin-unicorn";',
  language: "css/css",
  name: "sindresorhus/eslint-plugin-unicorn",
  order: 0,
  pluginName: "unicorn",
  pluginValue: "unicorn",
  rules: {
    "unicorn/prefer-explicit-viewport-units": "error"
  },
  url: "https://github.com/sindresorhus/eslint-plugin-unicorn"
});
