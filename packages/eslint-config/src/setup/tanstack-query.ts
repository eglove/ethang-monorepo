import tanstack from "@tanstack/eslint-plugin-query";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

// @ts-expect-error it's fine
const ruleNames = keys(getNonDeprecatedRules(tanstack.rules));

export const tanstackQueryRules = genRules(ruleNames, [], "@tanstack/query");
