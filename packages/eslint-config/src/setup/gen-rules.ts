import type { Linter, Rule } from "eslint";

import { Effect } from "effect";
import fromPairs from "lodash/fromPairs.js";
import get from "lodash/get.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

export type EsLintRules = Record<string, Rule.RuleModule>;

export const getNonDeprecatedRules = (rules: unknown) => {
  const filtered: EsLintRules = {};

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  for (const [key, value] of Object.entries(rules as EsLintRules)) {
    const deprecated = get(value, ["meta", "deprecated"]);

    if (false === deprecated || isNil(deprecated)) {
      filtered[key] = value;
    }
  }

  return filtered;
};

export type CustomRules = {
  name: string;
  rule: CustomRule;
  skipPrefix?: boolean;
}[];

type CustomRule = (Record<string, unknown> | string)[] | string;

const getRuleStrings = (
  ruleNames: string[],
  defaultOverride: string,
  prefix?: null | string
) => {
  const rules: Record<string, unknown> = {};

  for (const rule of ruleNames) {
    if (isNil(prefix)) {
      rules[rule] = isNil(defaultOverride) ? "error" : defaultOverride;
    } else {
      rules[`${prefix}/${rule}`] = isNil(defaultOverride)
        ? "error"
        : defaultOverride;
    }
  }

  return rules;
};

export const genRules = (
  ruleNames: string[],
  customRules?: CustomRules | null,
  prefix?: null | string,
  defaultOverride = "error"
) => {
  const rules = getRuleStrings(ruleNames, defaultOverride, prefix);

  if (!isNil(customRules)) {
    for (const rule of customRules) {
      if (includes(ruleNames, rule.name) || true === rule.skipPrefix) {
        // eslint-disable-next-line sonar/nested-control-flow
        if (isNil(prefix) || true === rule.skipPrefix) {
          rules[rule.name] = rule.rule;
        } else {
          rules[`${prefix}/${rule.name}`] = rule.rule;
        }
      } else {
        Effect.runSync(
          Effect.die(
            new Error(
              `${rule.name} in ${prefix ?? "(unknown prefix)"} does not exist.`
            )
          )
        );
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return fromPairs(
    Object.entries(rules).toSorted(([a], [b]) => {
      return a.localeCompare(b);
    })
  ) as Linter.RulesRecord;
};

export const createOffRules = (ruleNames: string[]) => {
  return map(ruleNames, (name) => {
    return { name, rule: "off" };
  });
};
