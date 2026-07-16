import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { noLodashMisuseRule } from "./no-lodash-misuse.ts";

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

ruleTester.run("no-lodash-misuse", noLodashMisuseRule as never, {
  invalid: [
    // no-commit: _.commit() on a chain
    {
      code: "_([1, 2, 3]).commit();",
      errors: [{ messageId: "noCommit" }]
    },
    {
      code: "chain([1, 2, 3]).commit();",
      errors: [{ messageId: "noCommit" }]
    },
    // no-double-unwrap: calling value() twice
    {
      code: "_([1, 2, 3]).map(fn).value().value();",
      errors: [{ messageId: "noDoubleUnwrap" }]
    },
    {
      code: "chain([1, 2, 3]).map(fn).value().value();",
      errors: [{ messageId: "noDoubleUnwrap" }]
    },
    {
      code: "_.custom().value().value();",
      errors: [{ messageId: "noDoubleUnwrap" }]
    },
    // no-extra-args: passing too many arguments to single-arg lodash functions
    {
      code: "flatten([1, [2]], true);",
      errors: [{ messageId: "noExtraArgs" }]
    },
    {
      code: "flattenDeep([1, [2]], true);",
      errors: [{ messageId: "noExtraArgs" }]
    },
    {
      code: "keyBy([{a:1}], 'a', 'b');",
      errors: [{ messageId: "noExtraArgs" }]
    },
    {
      code: "uniqueId('prefix', 'extra');",
      errors: [{ messageId: "noExtraArgs" }]
    },
    // no-unbound-this: using this in a lodash iteratee without binding
    {
      code: "map(xs, function(x) { return this.fn(x); });",
      errors: [{ messageId: "noUnboundThis" }]
    },
    {
      code: "each(xs, function(x) { this.process(x); });",
      errors: [{ messageId: "noUnboundThis" }]
    },
    {
      code: "filter(xs, function(x) { return this.pred(x); });",
      errors: [{ messageId: "noUnboundThis" }]
    }
  ],
  valid: [
    // no-commit: valid - no commit call
    "_([1, 2, 3]).map(fn).value();",
    "chain([1, 2, 3]).map(fn).value();",
    // no-extra-args: valid - correct number of args
    "flatten([1, [2]]);",
    "flattenDeep([1, [2]]);",
    "keyBy([{a:1}], 'a');",
    "map(xs, fn);",
    // no-unbound-this: valid - arrow functions don't have this
    "map(xs, (x) => x * 2);",
    "each(xs, (x) => console.log(x));",
    // no-unbound-this: valid - function without this
    "map(xs, function(x) { return x * 2; });",
    // no-unbound-this: valid - bound with bind
    "map(xs, function(x) { return this.fn(x); }.bind(obj));",
    // no-unbound-this: valid - 3rd arg thisArg
    "map(xs, function(x) { return this.fn(x); }, obj);",
    // no-unbound-this: valid - computed bind
    "map(xs, function(x) { return this.fn(x); }['bind'](obj));",
    // no-unbound-this: valid - iteratee is a plain call (not function expr)
    "map(xs, callback());",
    // no-unbound-this: valid - nested function with this (not the iteratee)
    "map(xs, function(x) { var inner = function() { return this; }; return inner(); });",
    // non-lodash calls
    "someRandomFunction([1, 2, 3], true);",
    "console.log('hello');",
    // commit/double-unwrap checks on non-lodash chains (not reported)
    "someFunc().commit();",
    "obj.method().commit();",
    "someFunc().value().value();",
    "obj.method().value().value();",
    // computed member access - not a real commit/value call
    "obj['commit']();",
    "obj['value']();",
    // non-member calls hitting isBoundFunction guards
    "someFunc();",
    "obj['bind']();"
  ]
});
