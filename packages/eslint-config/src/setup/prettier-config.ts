// @ts-expect-error no types
import prettierConfig from "eslint-config-prettier";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = Object.keys(getNonDeprecatedRules(prettierConfig.rules));

export const prettierConfigRules = genRules(ruleNames, [], "prettierConfig");
