import { RuleTester } from "eslint";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectCauseRule } from "./prefer-effect-cause.ts";

const pluginDirectory = import.meta.dirname;

const fixturesRoot = path.join(
  pluginDirectory,
  ".fixtures",
  "prefer-effect-cause"
);
const fixture = (name: string) => {
  return {
    code: "",
    filename: path.join(fixturesRoot, `${name}.fixture.ts`)
  };
};

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

ruleTester.run("prefer-effect-cause", preferEffectCauseRule as never, {
  invalid: [
    {
      code: "x instanceof Error;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "x instanceof TypeError;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "x instanceof SyntaxError;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "x instanceof ReferenceError;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "x instanceof RangeError;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "x instanceof URIError;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "x instanceof EvalError;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "x instanceof AggregateError;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "x instanceof CustomError;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "x instanceof ValidationError;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "x instanceof ApiError;",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "if (err instanceof Error) { }",
      errors: [{ messageId: "preferEffectCause" }]
    },
    {
      code: "if (err instanceof TypeError) { } else if (err instanceof SyntaxError) { }",
      errors: [
        { messageId: "preferEffectCause" },
        { messageId: "preferEffectCause" }
      ]
    }
  ],
  valid: [
    { code: "x instanceof Array;" },
    { code: "x instanceof Map;" },
    { code: "x instanceof Set;" },
    { code: "x instanceof Date;" },
    { code: "x instanceof RegExp;" },
    { code: "x instanceof Function;" },
    { code: "x instanceof Object;" },
    { code: "x instanceof String;" },
    { code: "x instanceof Number;" },
    { code: "x instanceof Boolean;" },
    { code: "x instanceof Promise;" },
    { code: "x instanceof Symbol;" },
    { code: "x instanceof SomeClass;" },
    { code: "x === Error;" },
    { code: "x === TypeError;" },
    { code: "x === 'Error';" },
    { code: "import { Cause } from 'effect'; Cause.failureOption(err);" },
    { code: "x instanceof SomeErrorLike;" },
    { code: "x instanceof Errorish;" },
    { code: "x instanceof (Error || TypeError);" },
    { code: "x instanceof getError();" },
    {
      ...fixture("valid-eslint-disable-next-line"),
      code: "// eslint-disable-next-line rule-to-test/prefer-effect-cause\nx instanceof Error;"
    },
    {
      ...fixture("valid-eslint-disable-block"),
      code: "/* eslint-disable rule-to-test/prefer-effect-cause */\nx instanceof Error;"
    }
  ]
});
