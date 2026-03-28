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
  ],
  "css",
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
  url: "https://github.com/eslint/css",
});
