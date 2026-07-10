import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { noTryCatchRule } from "./no-try-catch.ts";

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

ruleTester.run("no-try-catch", noTryCatchRule as never, {
  invalid: [
    {
      code: "try { foo(); } catch (e) { console.log(e); }",
      errors: [{ messageId: "noTry" }, { messageId: "noCatch" }]
    },
    {
      code: "throw new Error('boom');",
      errors: [{ messageId: "noThrow" }]
    },
    {
      code: "try { bar(); } finally { baz(); }",
      errors: [{ messageId: "noTry" }]
    }
  ],
  valid: [
    {
      code: "const x = Effect.try(() => foo());"
    },
    {
      code: "const y = Effect.fail(new Error('boom'));"
    },
    {
      code: "Effect.catchTag(error, 'MyError', () => 'fallback');"
    }
  ]
});
