import eslint from "@eslint/js";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { createOffRules, genRules } from "./gen-rules.ts";

const ruleNames = keys(eslint.configs.all.rules);
const customRules = [
  ...createOffRules([
    "camelcase",
    "capitalized-comments",
    "class-methods-use-this",
    "complexity",
    "consistent-return",
    "consistent-this",
    "curly",
    "default-case",
    "default-case-last",
    "default-param-last",
    "dot-notation",
    "func-names",
    "id-denylist",
    "id-length",
    "id-match",
    "init-declarations",
    "max-lines",
    "max-lines-per-function",
    "max-params",
    "max-statements",
    "new-cap",
    "no-array-constructor",
    "no-dupe-class-members",
    "no-empty-function",
    "no-implicit-globals",
    "no-implied-eval",
    "no-inline-comments",
    "no-magic-numbers",
    "no-redeclare",
    "no-restricted-exports",
    "no-restricted-globals",
    "no-restricted-imports",
    "no-restricted-properties",
    "no-restricted-syntax",
    "no-shadow",
    "no-template-curly-in-string",
    "no-ternary",
    "no-throw-literal",
    "no-undef",
    "no-undefined",
    "no-underscore-dangle",
    "no-unexpected-multiline",
    "no-unused-expressions",
    "no-unused-vars",
    "no-use-before-define",
    "no-useless-assignment",
    "no-useless-constructor",
    "no-warning-comments",
    "one-var",
    "prefer-arrow-callback",
    "prefer-destructuring",
    "prefer-promise-reject-errors",
    "require-await",
    "sort-imports",
    "sort-keys",
    "prefer-named-capture-group",
  ]),
  {
    name: "arrow-body-style",
    rule: ["error", "always"],
  },
  {
    name: "func-style",
    rule: ["error", "declaration", { allowArrowFunctions: true }],
  },
  {
    name: "no-unsafe-optional-chaining",
    rule: ["error", { disallowArithmeticOperators: true }],
  },
  {
    name: "yoda",
    rule: ["error", "always"],
  },
];

export const eslintRules = genRules(
  ruleNames,

  customRules,
);

export const eslintPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  name: "@eslint/js",
  order: 1,
  rules: eslintRules,
  url: "https://github.com/eslint/eslint/tree/main/packages/js",
});
