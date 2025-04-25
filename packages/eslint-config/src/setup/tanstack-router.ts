import tanstack from "@tanstack/eslint-plugin-router";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.js";

const ruleNames = keys(getNonDeprecatedRules(tanstack.rules));

export const tanstackRouterRules = genRules(ruleNames, [], "@tanstack/router");
