import perfectionist from "eslint-plugin-perfectionist";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
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
    rule: [
      "error",
      {
        fallbackSort: { order: "asc", type: "alphabetical" },
        order: "asc",
        type: "line-length",
      },
    ],
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

export const perfectionistPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import perfectionist from "eslint-plugin-perfectionist";',
  name: "eslint-plugin-perfectionist",
  order: 6,
  pluginName: "perfectionist",
  pluginValue: "perfectionist",
  rules: perfectionistRules,
  url: "https://github.com/azat-io/eslint-plugin-perfectionist",
});
