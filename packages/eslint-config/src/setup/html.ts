import html from "@html-eslint/eslint-plugin";
import get from "lodash/get.js";
import keys from "lodash/keys.js";

import { genRules } from "./gen-rules.ts";

const ruleNames = keys(get(html, ["rules"], []));

export const htmlRules = genRules(ruleNames, [], "html");
