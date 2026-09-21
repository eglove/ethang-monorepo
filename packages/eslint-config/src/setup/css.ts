import css from "@eslint/css";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.js";
import { unicornCssRules } from "./unicorn.ts";

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

// Unicorn rules that declare CSS support are derived from the plugin's own
// rule metadata (see unicorn.ts) and enabled here so they run against CSS
// files parsed by @eslint/css. The css-only subset is turned off for JS/TS
// in unicorn.ts.
export const unicornCssPlugin = new Plugin({
  files: "**/*.css",
  importString: 'import unicorn from "eslint-plugin-unicorn";',
  language: "css/css",
  name: "sindresorhus/eslint-plugin-unicorn",
  order: 0,
  pluginName: "unicorn",
  pluginValue: "unicorn",
  rules: unicornCssRules,
  url: "https://github.com/sindresorhus/eslint-plugin-unicorn"
});
