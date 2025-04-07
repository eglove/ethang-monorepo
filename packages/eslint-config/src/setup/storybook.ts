import storybook from "eslint-plugin-storybook";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.js";

const ruleNames = keys(getNonDeprecatedRules(storybook.rules));

const rules = genRules(ruleNames, [], "storybook");

export const storybookRules = rules;
