import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectEqualRule } from "./prefer-effect-equal.ts";

const MESSAGE_ID = "preferEffectEqual";

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

ruleTester.run("prefer-effect-equal", preferEffectEqualRule as never, {
  invalid: [
    {
      code: "JSON.stringify(a) === JSON.stringify(b);",
      errors: [{ messageId: MESSAGE_ID }]
    },
    {
      code: "JSON.stringify(a) !== JSON.stringify(b);",
      errors: [{ messageId: MESSAGE_ID }]
    },
    {
      code: "JSON.stringify(obj.x) === JSON.stringify(data.y);",
      errors: [{ messageId: MESSAGE_ID }]
    },
    {
      code: "JSON.stringify({ key: 1 }) === JSON.stringify({ key: 2 });",
      errors: [{ messageId: MESSAGE_ID }]
    },
    {
      code: "JSON.stringify(fn(a, b)) === JSON.stringify(fn(c, d));",
      errors: [{ messageId: MESSAGE_ID }]
    }
  ],
  valid: [
    // Already using Equal.equals
    { code: "Equal.equals(a, b);" },
    // Only one side is JSON.stringify
    { code: "JSON.stringify(a) === other(b);" },
    { code: "other(a) === JSON.stringify(b);" },
    // Loose equality (not strict)
    { code: "JSON.stringify(a) == JSON.stringify(b);" },
    { code: "JSON.stringify(a) != JSON.stringify(b);" },
    // Different method name
    { code: "JSON.parse(a) === JSON.parse(b);" },
    { code: "JSON.stringify(a) === JSON.parse(b);" },
    // Simple equality
    { code: "a === b;" },
    // Non-binary expression
    { code: "JSON.stringify(a);" },
    // String comparison
    { code: "'foo' === 'bar';" },
    // JSON.stringify in a different context
    { code: "const x = JSON.stringify(a);" }
  ]
});
