import storybook from "eslint-plugin-storybook";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.js";

const ruleNames = keys(getNonDeprecatedRules(storybook.rules));

const rules = genRules(ruleNames, [], "storybook");

export const storybookRules = rules;

export const storybookPlugin = new Plugin({
  files: "**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)",
  importString: 'import storybook from "eslint-plugin-storybook";',
  name: "eslint-plugin-storybook",
  pluginName: "storybook",
  pluginValue: "storybook",
  rules: storybookRules,
  url: "https://github.com/storybookjs/eslint-plugin-storybook",
});
