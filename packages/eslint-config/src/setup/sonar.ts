import sonar from "eslint-plugin-sonarjs";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(sonar.rules));
const customRules = [
  { name: "arrow-function-convention", rule: "off" },
  { name: "comment-regex", rule: "off" },
  { name: "file-header", rule: "off" },
  {
    name: "function-name",
    rule: [
      "error",
      {
        format: "^(?:[a-z][a-zA-Z0-9]*|[A-Z][A-Z0-9]*)$",
      },
    ],
  },
  { name: "function-return-type", rule: "off" },
  { name: "max-union-size", rule: "off" },
  { name: "no-implicit-dependencies", rule: "off" },
  { name: "no-inconsistent-returns", rule: "off" },
  { name: "no-undefined-assignment", rule: "off" },
  { name: "shorthand-property-grouping", rule: "off" }, // Conflicts with perfectionist sorting
  { name: "todo-tag", rule: "off" },
  { name: "no-reference-error", rule: "off" },
];

export const sonarRules = genRules(ruleNames, customRules, "sonar");

export const sonarPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import sonar from "eslint-plugin-sonarjs";',
  name: "eslint-plugin-sonarjs",
  order: 5,
  pluginName: "sonar",
  pluginValue: "sonar",
  rules: sonarRules,
  url: "https://github.com/SonarSource/SonarJS/blob/master/packages/jsts/src/rules/README.md",
});
