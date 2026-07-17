import { RuleTester } from "eslint";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashClampRule } from "./prefer-lodash-clamp.ts";

const pluginDirectory = import.meta.dirname;

const fixturesRoot = path.join(
  pluginDirectory,
  ".fixtures",
  "prefer-lodash-clamp"
);
const fixture = (name: string) => {
  return {
    code: "",
    filename: path.join(fixturesRoot, `${name}.fixture.ts`)
  };
};

const MESSAGE_ID = "preferLodashClamp" as const;
const PREFER_LODASH_DISABLE =
  "// eslint-disable-next-line @ethang/prefer-lodash\nclamp(x, 0, 10);";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 2024,
      sourceType: "module"
    }
  }
});

ruleTester.run("prefer-lodash-clamp", preferLodashClampRule as never, {
  invalid: [
    // -------- outer Math.min + inner Math.max --------
    {
      code: "Math.min(10, Math.max(0, x));",
      errors: [{ messageId: MESSAGE_ID }],
      output: PREFER_LODASH_DISABLE
    },

    // -------- outer Math.min + inner Math.max, swapped argument positions --------
    {
      code: "Math.min(Math.max(0, x), 10);",
      errors: [{ messageId: MESSAGE_ID }],
      output: PREFER_LODASH_DISABLE
    },

    // -------- outer Math.max + inner Math.min (clamp via min of upper) --------
    {
      code: "Math.max(0, Math.min(10, x));",
      errors: [{ messageId: MESSAGE_ID }],
      output: PREFER_LODASH_DISABLE
    },

    // -------- outer Math.max + inner Math.min, swapped argument positions --------
    {
      code: "Math.max(Math.min(10, x), 0);",
      errors: [{ messageId: MESSAGE_ID }],
      output: PREFER_LODASH_DISABLE
    },

    // -------- identifier bounds + identifier value --------
    {
      code: "Math.min(MAX, Math.max(MIN, score));",
      errors: [{ messageId: MESSAGE_ID }],
      output:
        "// eslint-disable-next-line @ethang/prefer-lodash\nclamp(score, MIN, MAX);"
    },

    // -------- expression value --------
    {
      code: "Math.min(10, Math.max(0, computeScore()));",
      errors: [{ messageId: MESSAGE_ID }],
      output:
        "// eslint-disable-next-line @ethang/prefer-lodash\nclamp(computeScore(), 0, 10);"
    }
  ],
  valid: [
    // -------- already lodash --------
    { code: "clamp(x, 0, 10);" },
    {
      code: "import clamp from 'lodash/clamp.js'; clamp(x, 0, 10);"
    },

    // -------- Math.min / Math.max in other shapes --------
    { code: "Math.min(0, x);" },
    { code: "Math.max(0, x);" },
    { code: "Math.min(0, x, y);" },
    { code: "Math.max(0, x, y);" },
    { code: "Math.min();Math.max();" },
    { code: "Math.min(a, b);" },
    { code: "Math.max(a, b);" },

    // -------- non-Math callees --------
    { code: "myMath.min(10, myMath.max(0, x));" },
    { code: "Math.floor(Math.abs(x));" },
    { code: "Math.min(10, Math.max(0, x) + 1);" },

    // -------- computed property access --------
    { code: "Math['min'](10, Math.max(0, x));" },
    { code: "Math.min(10, Math['max'](0, x));" },

    // -------- single-argument inner --------
    { code: "Math.min(10, Math.max(0));" },

    // -------- nested clamp (would drop a bound) --------
    { code: "Math.min(10, Math.max(0, Math.min(5, x)));" },

    // -------- empty inner --------
    { code: "Math.min(10, Math.max());" },

    // -------- eslint-disable directive (anchored to a real fixture file) --------
    {
      ...fixture("valid-eslint-disable"),
      code: "// eslint-disable-next-line rule-to-test/prefer-lodash-clamp\nMath.min(10, Math.max(0, x));"
    }
  ]
});
