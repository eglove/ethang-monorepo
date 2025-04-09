// @ts-expect-error export exists
import tanstack from "@tanstack/eslint-plugin-query";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(tanstack.rules));

export const tanstackQueryRules = genRules(ruleNames, [], "@tanstack/query");
