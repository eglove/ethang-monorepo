import tailwind from "eslint-plugin-tailwindcss";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

// @ts-expect-error ignore
const ruleNames = keys(getNonDeprecatedRules(tailwind.rules ?? {}));
const customRules = [{ name: "no-custom-classname", rule: "off" }];

export const tailwindRules = genRules(ruleNames, customRules, "tailwind");
