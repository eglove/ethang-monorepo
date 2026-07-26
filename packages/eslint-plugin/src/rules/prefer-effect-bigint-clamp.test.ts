import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectBigIntClampRule } from "./prefer-effect-bigint-clamp.ts";

const MESSAGE_ID = "preferEffectBigIntClamp";
const CANONICAL_OUTPUT = "BigInt.clamp(x, { min: min, max: max });";

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

ruleTester.run(
  "prefer-effect-bigint-clamp",
  preferEffectBigIntClampRule as never,
  {
    invalid: [
      // -------- pattern 1: x > max ? max : x < min ? min : x --------
      {
        code: "x > max ? max : x < min ? min : x;",
        errors: [{ messageId: MESSAGE_ID }],
        output: CANONICAL_OUTPUT
      },
      // -------- pattern 2: x < min ? min : x > max ? max : x --------
      {
        code: "x < min ? min : x > max ? max : x;",
        errors: [{ messageId: MESSAGE_ID }],
        output: CANONICAL_OUTPUT
      },
      // -------- with literal bigint bounds --------
      {
        code: "val > 100n ? 100n : val < 0n ? 0n : val;",
        errors: [{ messageId: MESSAGE_ID }],
        output: "BigInt.clamp(val, { min: 0n, max: 100n });"
      },
      // -------- pattern 2 with literal bounds --------
      {
        code: "val < 0n ? 0n : val > 100n ? 100n : val;",
        errors: [{ messageId: MESSAGE_ID }],
        output: "BigInt.clamp(val, { min: 0n, max: 100n });"
      }
    ],
    valid: [
      // -------- already using BigInt.clamp --------
      { code: CANONICAL_OUTPUT },
      // -------- not a clamp pattern (consequent doesn't match bound) --------
      { code: "x > max ? other : x < min ? min : x;" },
      // -------- inner consequent doesn't match min --------
      { code: "x > max ? max : x < min ? other : x;" },
      // -------- inner alternate doesn't match value --------
      { code: "x > max ? max : x < min ? min : other;" },
      // -------- not a ternary at all --------
      { code: "x > max ? max : x;" },
      // -------- simple ternary (no nested clamp) --------
      { code: "a ? b : c;" },
      // -------- inner is not a ternary --------
      { code: "x > max ? max : x < min;" },
      // -------- comparison operators don't match --------
      { code: "x >= max ? max : x <= min ? min : x;" },
      // -------- reversed comparison direction --------
      { code: "max > x ? max : min > x ? min : x;" }
    ]
  }
);
