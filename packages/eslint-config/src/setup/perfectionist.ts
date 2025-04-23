import perfectionist from "eslint-plugin-perfectionist";
import keys from "lodash/keys.js";

import {
  type EsLintRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = keys(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  getNonDeprecatedRules(perfectionist.rules as unknown as EsLintRules),
);
const customRules = [
  {
    name: "sort-jsx-props",
    rule: ["error", { groups: ["shorthand", "multiline"] }],
  },
  {
    name: "sort-objects",
    rule: ["error", { partitionByComment: true }],
  },
  {
    name: "sort-switch-case",
    rule: [
      "error",
      {
        order: "asc",
        type: "alphabetical",
      },
    ],
  },
  {
    name: "sort-variable-declarations",
    rule: [
      "error",
      {
        order: "asc",
        type: "alphabetical",
      },
    ],
  },
];

export const perfectionistRules = genRules(
  ruleNames,
  customRules,
  "perfectionist",
);
