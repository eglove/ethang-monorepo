import angularTS from "@angular-eslint/eslint-plugin";
import angularTemplate from "@angular-eslint/eslint-plugin-template";
import { genRules, getNonDeprecatedRules } from "./gen-rules.js";

// @ts-expect-error this is ok
const tsRuleNames = Object.keys(getNonDeprecatedRules(angularTS.rules));
const templateRuleNames = Object.keys(
  // @ts-expect-error this is ok
  getNonDeprecatedRules(angularTemplate.rules),
);

const customTsRules = [
  {
    name: "directive-selector",
    rule: ["error", { type: "attribute", prefix: "app", style: "camelCase" }],
  },
  {
    name: "component-selector",
    rule: ["error", { type: "element", prefix: "app", style: "kebab-case" }],
  },
];

const customTemplateRules = [
  { name: "i18n", rule: "off" },
  { name: "no-call-expression", rule: "off" },
  { name: "prefer-ngsrc", rule: "warn" },
];

export const angularTsRules = genRules(
  tsRuleNames,
  customTsRules,
  "@angular-eslint",
);
export const angularTemplateRules = genRules(
  templateRuleNames,
  customTemplateRules,
  "@angular-eslint/template",
);
