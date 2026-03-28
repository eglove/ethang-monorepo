import angularTS from "@angular-eslint/eslint-plugin";
import angularTemplate from "@angular-eslint/eslint-plugin-template";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
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
  customTsRules,
  "@angular-eslint",
);
export const angularTemplateRules = genRules(
  templateRuleNames,
  customTemplateRules,
  "@angular-eslint/template",
);

export const angularTsPlugin = new Plugin({
  auxiliaryImport: 'import angular from "angular-eslint";',
  files: "**/*.ts",
  importString: 'import angularTS from "@angular-eslint/eslint-plugin";',
  name: "@angular-eslint/eslint-plugin",
  pluginName: "@angular-eslint",
  pluginValue: "angularTS",
  processor: "angular.processInlineTemplates",
  rules: angularTsRules,
  url: "https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/README.md",
});

export const angularTemplatePlugin = new Plugin({
  files: "**/*.html",
  importString:
    'import angularTemplate from "@angular-eslint/eslint-plugin-template";',
  includeAngularLanguageOptions: true,
  name: "@angular-eslint/eslint-plugin-template",
  pluginName: "@angular-eslint/template",
  pluginValue: "angularTemplate",
  rules: angularTemplateRules,
  url: "https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/README.md",
});
