import { Schema } from "effect";
import unicorn from "eslint-plugin-unicorn";
import get from "lodash/get.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import keys from "lodash/keys.js";
import pickBy from "lodash/pickBy.js";

import { Plugin } from "../build/plugin.ts";
import {
  createOffRules,
  type EsLintRules,
  genRules,
  getNonDeprecatedRules
} from "./gen-rules.ts";

const supportedLanguagesSchema = Schema.Union(
  Schema.Null,
  Schema.Undefined,
  Schema.Array(Schema.String)
);

export const getSupportedLanguages = (rule: unknown) => {
  return (
    Schema.decodeUnknownSync(supportedLanguagesSchema)(
      get(rule, ["meta", "languages"])
    ) ?? null
  );
};

// Rules without an explicit languages declaration predate multi-language
// support and only run on js.
export const supportsJs = (rule: unknown) => {
  const languages = getSupportedLanguages(rule);

  return (
    isNil(languages) || includes(languages, "*") || includes(languages, "js/js")
  );
};

export const supportsCss = (rule: unknown) => {
  const languages = getSupportedLanguages(rule);

  return (
    !isNil(languages) &&
    (includes(languages, "*") || includes(languages, "css/css"))
  );
};

const ruleRecords: EsLintRules = getNonDeprecatedRules(unicorn.rules);

export const unicornCssRuleNames = keys(pickBy(ruleRecords, supportsCss));
export const unicornCssOnlyRuleNames = keys(
  pickBy(ruleRecords, (rule) => {
    return supportsCss(rule) && !supportsJs(rule);
  })
);

const customRules = [
  {
    name: "empty-brace-spaces",
    rule: "off"
  },
  {
    name: "name-replacements",
    rule: "off"
  },
  {
    name: "explicit-length-check",
    rule: "off"
  },
  {
    name: "no-keyword-prefix",
    rule: "off"
  },
  {
    name: "no-nested-ternary",
    rule: "off"
  },
  {
    name: "no-null",
    rule: "off"
  },
  {
    name: "number-literal-case",
    rule: "off"
  },
  {
    name: "template-indent",
    rule: "off"
  },
  {
    name: "prefer-type-literal-last",
    rule: "off"
  },
  {
    name: "no-incorrect-template-string-interpolation",
    rule: "off"
  },
  { name: "consistent-class-member-order", rule: "off" },
  { name: "no-top-level-side-effects", rule: "off" },
  { name: "prefer-await", rule: "off" },
  { name: "default-export-style", rule: "off" },
  { name: "prefer-temporal", rule: "off" },
  { name: "no-exports-in-scripts", rule: "off" },
  { name: "consistent-arrow-return-style", rule: "off" },
  // unicorn/prefer-continue contradicts the core no-continue rule; no-continue wins.
  { name: "prefer-continue", rule: "off" },
  ...createOffRules(unicornCssOnlyRuleNames)
];

const unicornPrefix = "unicorn";

export const unicornRules = genRules(
  keys(ruleRecords),
  customRules,
  unicornPrefix
);
export const unicornCssRules = genRules(
  unicornCssRuleNames,
  null,
  unicornPrefix
);

export const unicornPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import unicorn from "eslint-plugin-unicorn";',
  name: "sindresorhus/eslint-plugin-unicorn",
  order: 3,
  pluginName: unicornPrefix,
  pluginValue: unicornPrefix,
  rules: unicornRules,
  url: "https://github.com/sindresorhus/eslint-plugin-unicorn"
});
