import keys from "lodash/keys.js";
import tseslint from "typescript-eslint";

import {
  type EsLintRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = keys(
  getNonDeprecatedRules(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    (tseslint.plugin.rules ?? {}) as unknown as EsLintRules,
  ),
);
const customRules = [
  {
    name: "adjacent-overload-signatures",
    rule: "off",
  },
  {
    name: "class-methods-use-this",
    rule: "off",
  },
  {
    name: "consistent-return",
    rule: "off",
  },
  {
    name: "consistent-type-definitions",
    rule: ["error", "type"],
  },
  {
    name: "consistent-type-imports",
    rule: ["error", { fixStyle: "inline-type-imports" }],
  },
  {
    name: "explicit-function-return-type",
    rule: "off",
  },
  {
    name: "explicit-module-boundary-types",
    rule: "off",
  },
  {
    name: "init-declarations",
    rule: "off",
  },
  {
    name: "member-ordering",
    rule: "off",
  },
  {
    name: "naming-convention",
    rule: "off",
  },
  {
    name: "no-dupe-class-members",
    rule: "off",
  },
  {
    name: "no-invalid-this",
    rule: "off",
  },
  {
    name: "no-magic-numbers",
    rule: "off",
  },
  {
    name: "no-redeclare",
    rule: "off",
  },
  {
    name: "no-unnecessary-type-parameters",
    rule: "off",
  },
  {
    name: "no-use-before-define",
    rule: "off",
  },
  {
    name: "parameter-properties",
    rule: "off",
  },
  {
    name: "prefer-readonly-parameter-types",
    rule: "off",
  },
  {
    name: "max-params",
    rule: "off",
  },
  {
    name: "no-unused-vars",
    rule: [
      "error",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        ignoreRestSiblings: true,
        varsIgnorePattern: "^_",
      },
    ],
  },
];

export const typescriptRules = genRules(
  ruleNames,
  customRules,
  "@typescript-eslint",
);
