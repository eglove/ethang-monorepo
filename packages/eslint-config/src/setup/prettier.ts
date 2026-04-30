import prettier from "eslint-plugin-prettier";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(prettier.rules));

const customRules = [
  {
    name: "prettier",
    rule: [
      "error",
      {
        endOfLine: "lf",
        trailingComma: "none"
      }
    ]
  }
];

export const prettierRules = genRules(ruleNames, customRules, "prettier");

export const prettierPlugin = new Plugin({
  files: "**/*",
  importString: 'import prettier from "eslint-plugin-prettier";',
  name: "prettier",
  pluginName: "prettier",
  pluginValue: "prettier",
  rules: prettierRules,
  url: "https://github.com/prettier/eslint-plugin-prettier"
});
