import { RuleTester } from "eslint";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashEscapeRegexpRule } from "./prefer-lodash-escape-regexp.ts";

const pluginDirectory = import.meta.dirname;

const fixturesRoot = path.join(
  pluginDirectory,
  ".fixtures",
  "prefer-lodash-escape-regexp"
);
const fixture = (name: string) => {
  return {
    code: "",
    filename: path.join(fixturesRoot, `${name}.fixture.ts`)
  };
};

const MESSAGE_ID = "preferLodashEscapeRegexp" as const;
const PREFER_LODASH_DISABLE =
  "// eslint-disable-next-line @ethang/prefer-lodash\nescapeRegExp(str);";

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
  "prefer-lodash-escape-regexp",
  preferLodashEscapeRegexpRule as never,
  {
    invalid: [
      // -------- canonical pattern --------
      {
        code: String.raw`str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');`,
        errors: [{ messageId: MESSAGE_ID }],
        output: PREFER_LODASH_DISABLE
      },

      // -------- simpler character class regex --------
      {
        code: String.raw`str.replace(/[<>]/g, '\\$&');`,
        errors: [{ messageId: MESSAGE_ID }],
        output: PREFER_LODASH_DISABLE
      },

      // -------- $0 instead of $& --------
      {
        code: String.raw`str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$0');`,
        errors: [{ messageId: MESSAGE_ID }],
        output: PREFER_LODASH_DISABLE
      },

      // -------- identifier as string source --------
      {
        code: String.raw`input.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');`,
        errors: [{ messageId: MESSAGE_ID }],
        output:
          "// eslint-disable-next-line @ethang/prefer-lodash\nescapeRegExp(input);"
      },

      // -------- expression as string source --------
      {
        code: String.raw`getStr().replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');`,
        errors: [{ messageId: MESSAGE_ID }],
        output:
          "// eslint-disable-next-line @ethang/prefer-lodash\nescapeRegExp(getStr());"
      }
    ],
    valid: [
      // -------- already using escapeRegExp --------
      { code: "escapeRegExp(str);" },
      {
        code: "import escapeRegExp from 'lodash/escapeRegExp.js'; escapeRegExp(str);"
      },

      // -------- replace without character class regex --------
      { code: "str.replace(/foo/g, 'bar');" },

      // -------- replace without \\$& replacement --------
      { code: "str.replace(/[<>]/g, 'replacement');" },

      // -------- replace with only one argument --------
      { code: "str.replace(/[<>]/g);" },

      // -------- replace without 'g' flag (semantic shift - single match vs all) --------
      {
        code: String.raw`str.replace(/[\\^$*+?.()|[\]{}]/, '\\$&');`
      },

      // -------- replace with non-literal regex --------
      { code: String.raw`str.replace(regex, '\\$&');` },

      // -------- replace with non-literal replacement --------
      { code: "str.replace(/[<>]/g, replacer);" },

      // -------- non-replace method --------
      { code: "str.match(/[<>]/g);" },

      // -------- eslint-disable directive (anchored to fixture file) --------
      {
        ...fixture("valid-eslint-disable"),
        code: "// eslint-disable-next-line rule-to-test/prefer-lodash-escape-regexp\nstr.replace(/[\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');"
      }
    ]
  }
);
