import angularTS from "@angular-eslint/eslint-plugin";
import angularTemplate from "@angular-eslint/eslint-plugin-template";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.js";

const tsRuleNames = keys(getNonDeprecatedRules(angularTS.rules));
const templateRuleNames = keys(getNonDeprecatedRules(angularTemplate.rules));

const customTsRules = [
  {
    name: "directive-selector",
    rule: ["error", { prefix: "app", style: "camelCase", type: "attribute" }],
  },
  {
    name: "component-selector",
    rule: ["error", { prefix: "app", style: "kebab-case", type: "element" }],
  },
];

const customTemplateRules = [
  { name: "i18n", rule: "off" },
  { name: "no-call-expression", rule: "off" },
  { name: "prefer-ngsrc", rule: "warn" },
];

export const angularTsRules = genRules(
  tsRuleNames,
  // @ts-expect-error loose types
  customTsRules,
  "@angular-eslint",
);
export const angularTemplateRules = genRules(
  templateRuleNames,
  customTemplateRules,
  "@angular-eslint/template",
);
