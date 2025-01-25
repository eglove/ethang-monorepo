import prettierPlugin from "eslint-plugin-prettier";
import { genRules, getNonDeprecatedRules } from "./gen-rules.js";

// @ts-expect-error ignore
const ruleNames = Object.keys(getNonDeprecatedRules(prettierPlugin.rules));

export const prettierPluginRules = genRules(ruleNames, [], "prettierPlugin");
