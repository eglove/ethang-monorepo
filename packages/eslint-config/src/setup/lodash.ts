// @ts-expect-error no types
import lodash from "eslint-plugin-lodash";
import keys from "lodash/keys.js";

import {
  type EsLintRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = keys(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-unsafe-member-access
  getNonDeprecatedRules(lodash.rules as unknown as EsLintRules),
);
const customRules = [
  {
    name: "chain-style",
    rule: [2, "as-needed"],
  },
  {
    name: "consistent-compose",
    rule: [2, "flow"],
  },
  {
    name: "identity-shorthand",
    rule: [2, "always"],
  },
  {
    name: "import-scope",
    rule: [2, "method"],
  },
  {
    name: "matches-prop-shorthand",
    rule: [2, "always"],
  },
  {
    name: "matches-shorthand",
    rule: [2, "always", 3],
  },
  {
    name: "path-style",
    rule: [2, "array"],
  },
  {
    name: "prefer-includes",
    rule: [2, { includeNative: true }],
  },
  {
    name: "prefer-some",
    rule: [2, { includeNative: true }],
  },
  {
    name: "prop-shorthand",
    rule: [2, "always"],
  },
];

// @ts-expect-error loose types
export const lodashRules = genRules(ruleNames, customRules, "lodash");
