import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { noCollectionIssuesRule } from "./no-collection-issues.ts";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser
  }
});

ruleTester.run("no-collection-issues", noCollectionIssuesRule as never, {
  invalid: [
    // collection-return: map iteratee without return
    {
      code: "map(xs, function(x) { console.log(x); });",
      errors: [{ messageId: "noCollectionReturn" }]
    },
    {
      code: "filter(xs, function(x) { if (x > 0) { x; } });",
      errors: [{ messageId: "noCollectionReturn" }]
    },
    {
      code: "_.map(xs, function(x) { process(x); });",
      errors: [{ messageId: "noCollectionReturn" }]
    },
    // collection-return: reduce without return
    {
      code: "reduce(xs, function(acc, x) { acc.push(x); }, []);",
      errors: [{ messageId: "noCollectionReturn" }]
    },
    // unwrap: single chain method then value() is unnecessary
    {
      code: "_(xs).map(fn).value();",
      errors: [{ messageId: "unwrap" }]
    },
    {
      code: "chain(xs).filter(fn).value();",
      errors: [{ messageId: "unwrap" }]
    },
    // collection-method-value: chain method used outside a chain
    {
      code: "_(xs).map(fn);",
      errors: [{ messageId: "collectionMethodValue" }]
    },
    {
      code: "chain(xs).filter(fn);",
      errors: [{ messageId: "collectionMethodValue" }]
    },
    // collection-method-value: chain on _.seqmethod() traces to _ identifier
    {
      code: "_.plant().map(fn);",
      errors: [{ messageId: "collectionMethodValue" }]
    }
  ],
  valid: [
    // collection-return: valid - iteratee returns a value
    "map(xs, function(x) { return x * 2; });",
    "filter(xs, function(x) { return x > 0; });",
    "reduce(xs, function(acc, x) { return acc + x; }, 0);",
    // collection-return: valid - arrow functions with expression body
    "map(xs, (x) => x * 2);",
    "filter(xs, (x) => x > 0);",
    "reduce(xs, (acc, x) => acc + x, 0);",
    // collection-return: valid - each/forEach don't need return
    "each(xs, function(x) { console.log(x); });",
    "forEach(xs, function(x) { process(x); });",
    // collection-return: valid - arrow function with block body that returns
    "map(xs, (x) => { return x * 2; });",
    // collection-return: valid - nested function with return (not checked)
    "map(xs, function(x) { var inner = function() { return 1; }; return inner(); });",
    // unwrap: valid - chain with multiple methods then value()
    "_(xs).map(fn).filter(fn).value();",
    "chain(xs).map(fn).filter(fn).value();",
    // unwrap: valid - non-chain calls
    "map(xs, fn);",
    "filter(xs, fn);",
    // collection-method-value: valid - chain assigned to variable
    "var result = _(xs).map(fn);",
    "var result = chain(xs).filter(fn);",
    // non-lodash calls
    "someRandomFunction(xs, fn);",
    "console.log('hello');",
    // collection-return: valid - find with return
    "find(xs, function(x) { return x > 0; });",
    "some(xs, function(x) { return x > 0; });",
    "every(xs, function(x) { return x > 0; });",
    // collection-return: valid - arrow each/forEach
    "each(xs, (x) => console.log(x));",
    "forEachRight(xs, (x) => process(x));",
    // seq/chain methods are not checked for collection-method-value
    "_(xs).tap(fn);",
    // value() on non-call expression (not a chain unwrap)
    "obj.value();",
    // value() on direct lodash method call (count=0, not single-method chain)
    "_.map(fn).value();",
    // value() on non-lodash chain (not a lodash chain unwrap)
    "someFunc().map(fn).value();",
    // non-lodash member calls on chains
    "obj.method().filter(fn);",
    // lodash chain method assigned to variable (consumed)
    "var result = _(xs).map(fn).filter(fn);",
    // computed member access (callee is not identifier/member with identifier property)
    "obj['map'](xs, fn);"
  ]
});
