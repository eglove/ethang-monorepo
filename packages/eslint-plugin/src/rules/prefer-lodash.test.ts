import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashRule } from "./prefer-lodash.ts";

const UNKNOWN_METHOD = "xs.unknownMethod();";
const CHAIN_OUTPUT = "map(xs, (x) => x).filter((x) => x);";

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

ruleTester.run("prefer-lodash", preferLodashRule as never, {
  invalid: [
    // --- Existing array method conversion tests ---
    {
      code: "[1, 2, 3].map((x) => x * 2);",
      errors: [{ messageId: "preferLodash" }],
      options: [{ importStyle: "deep" }],
      output: "map([1, 2, 3], (x) => x * 2);"
    },
    {
      code: "const xs = [1, 2, 3]; xs.filter((x) => x > 1);",
      errors: [{ messageId: "preferLodash" }],
      output: "const xs = [1, 2, 3]; filter(xs, (x) => x > 1);"
    },
    {
      code: "const xs = [1, 2, 3]; xs.groupBy((x) => x % 2);",
      errors: [{ messageId: "preferLodash" }],
      output: "const xs = [1, 2, 3]; groupBy(xs, (x) => x % 2);"
    },
    {
      code: "xs.map((x) => x).filter((x) => x);",
      errors: [
        { messageId: "preferLodash" },
        { messageId: "preferLodashMethod" },
        { messageId: "preferLodash" }
      ],
      options: [{ chainStyle: "always" }],
      output: CHAIN_OUTPUT
    },
    {
      code: "[1, 2, 3].map((x) => x * 2);",
      errors: [{ messageId: "preferLodash" }],
      options: [{ importStyle: "namespace" }],
      output: "map([1, 2, 3], (x) => x * 2);"
    },
    {
      code: "xs.map((x) => x).filter((x) => x);",
      errors: [
        { messageId: "preferLodash" },
        { messageId: "preferLodashMethod" },
        { messageId: "preferLodash" }
      ],
      output: CHAIN_OUTPUT
    },
    {
      code: "xs.map((x) => x);",
      errors: [{ messageId: "preferLodash" }],
      options: [{ chainStyle: "never" }],
      output: "map(xs, (x) => x);"
    },
    {
      code: "getArray().map((x) => x).filter((x) => x);",
      errors: [
        { messageId: "preferLodash" },
        { messageId: "preferLodashMethod" },
        { messageId: "preferLodash" }
      ],
      options: [{ chainStyle: "as-needed" }],
      output: "map(getArray(), (x) => x).filter((x) => x);"
    },
    {
      code: "xs.map((x) => x).forEach((x) => x);",
      errors: [
        { messageId: "preferLodashMethod" },
        { messageId: "preferLodash" }
      ],
      output: "map(xs, (x) => x).forEach((x) => x);"
    },
    {
      code: "xs.filter((x) => x > 1).unknownChain();",
      errors: [{ messageId: "preferLodash" }],
      options: [{ chainStyle: "always" }],
      output: "filter(xs, (x) => x > 1).unknownChain();"
    },
    {
      code: "const fn = () => 1; xs.map((x) => x)[fn()];",
      errors: [{ messageId: "preferLodash" }],
      options: [{ chainStyle: "always" }],
      output: "const fn = () => 1; map(xs, (x) => x)[fn()];"
    },
    {
      code: "const k = 'foo'; xs.map((x) => x)[k];",
      errors: [{ messageId: "preferLodash" }],
      options: [{ chainStyle: "always" }],
      output: "const k = 'foo'; map(xs, (x) => x)[k];"
    },
    {
      code: "xs.filter((x) => x > 1).someMethod((x) => x);",
      errors: [{ messageId: "preferLodash" }],
      options: [{ chainStyle: "always" }],
      output: "filter(xs, (x) => x > 1).someMethod((x) => x);"
    },
    {
      code: "xs['map']((x) => x).filter((x) => x);",
      errors: [{ messageId: "preferLodash" }, { messageId: "preferLodash" }],
      options: [{ chainStyle: "always" }],
      output: CHAIN_OUTPUT
    },

    // --- prefer-is-nil: typeof x === 'undefined' || x === null ---
    {
      code: "if (x === null || x === undefined) { return; }",
      errors: [{ messageId: "preferIsNil" }]
    },
    {
      code: "if (x === undefined || x === null) { return; }",
      errors: [{ messageId: "preferIsNil" }]
    },
    {
      code: "if (typeof x === 'undefined' || x === null) { return; }",
      errors: [{ messageId: "preferIsNil" }]
    },
    {
      code: "if ('undefined' === typeof x || x === null) { return; }",
      errors: [{ messageId: "preferIsNil" }]
    },
    {
      code: "const isEmpty = x === null || x === undefined;",
      errors: [{ messageId: "preferIsNil" }]
    },

    // --- prefer-lodash-typecheck: typeof x === 'string' -> isString(x) ---
    {
      code: "typeof x === 'string'",
      errors: [
        {
          data: { lodash: "isString", native: "typeof" },
          messageId: "preferTypecheck"
        }
      ]
    },
    {
      code: "typeof x === 'number'",
      errors: [
        {
          data: { lodash: "isNumber", native: "typeof" },
          messageId: "preferTypecheck"
        }
      ]
    },
    {
      code: "typeof x === 'boolean'",
      errors: [
        {
          data: { lodash: "isBoolean", native: "typeof" },
          messageId: "preferTypecheck"
        }
      ]
    },
    {
      code: "typeof x === 'function'",
      errors: [
        {
          data: { lodash: "isFunction", native: "typeof" },
          messageId: "preferTypecheck"
        }
      ]
    },
    {
      code: "'string' === typeof x",
      errors: [
        {
          data: { lodash: "isString", native: "typeof" },
          messageId: "preferTypecheck"
        }
      ]
    },
    {
      code: "typeof x === 'object'",
      errors: [
        {
          data: { lodash: "isObject", native: "typeof" },
          messageId: "preferTypecheck"
        }
      ]
    },

    // --- prefer-includes: indexOf !== -1 -> includes ---
    {
      code: "xs.indexOf(item) !== -1",
      errors: [{ messageId: "preferIncludes" }]
    },
    {
      code: "xs.indexOf(item) >= 0",
      errors: [{ messageId: "preferIncludes" }]
    },
    {
      code: "-1 !== xs.indexOf(item)",
      errors: [{ messageId: "preferIncludes" }]
    },
    {
      code: "xs.indexOf(item) === -1",
      errors: [{ messageId: "preferIncludesNegated" }]
    },

    // --- prefer-startswith: indexOf === 0 -> startsWith ---
    {
      code: "str.indexOf('foo') === 0",
      errors: [{ messageId: "preferStartsWith" }]
    },
    {
      code: "str.indexOf('foo') < 1",
      errors: [{ messageId: "preferStartsWith" }]
    },
    {
      code: "0 === str.indexOf('foo')",
      errors: [{ messageId: "preferStartsWith" }]
    },

    // --- prefer-compact: filter(Boolean) -> compact ---
    {
      code: "xs.filter(Boolean)",
      errors: [{ messageId: "preferCompact" }]
    },
    {
      code: "_.filter(xs, Boolean)",
      errors: [{ messageId: "preferCompact" }]
    },
    {
      code: "xs.filter((x) => Boolean(x))",
      errors: [{ messageId: "preferCompact" }]
    },
    {
      code: "xs.filter((x) => !!x)",
      errors: [{ messageId: "preferCompact" }]
    },

    // --- prefer-some: findIndex !== -1 -> some ---
    {
      code: "xs.findIndex((x) => x > 1) !== -1",
      errors: [{ messageId: "preferSome" }]
    },
    {
      code: "xs.findIndex((x) => x > 1) >= 0",
      errors: [{ messageId: "preferSome" }]
    },

    // --- prefer-get: a && a.b && a.b.c -> get(a, 'b.c') ---
    {
      code: "const x = a && a.b && a.b.c;",
      errors: [{ messageId: "preferGet" }]
    },
    {
      code: "const x = a && a.b;",
      errors: [{ messageId: "preferGet" }]
    },
    {
      code: "const x = a && a.b && a.b.c && a.b.c.d;",
      errors: [{ messageId: "preferGet" }]
    },

    // --- prefer-map: forEach + push -> map ---
    {
      code: "const result = []; xs.forEach((x) => { result.push(x * 2); });",
      errors: [{ messageId: "preferMap" }]
    },

    // --- prefer-filter: forEach + if + push -> filter ---
    {
      code: "const result = []; xs.forEach((x) => { if (x > 1) { result.push(x); } });",
      errors: [{ messageId: "preferFilter" }]
    },

    // --- prefer-find: filter[0] -> find ---
    {
      code: "xs.filter((x) => x > 1)[0]",
      errors: [{ messageId: "preferFind" }]
    },
    {
      code: "xs.filter((x) => x > 1).shift()",
      errors: [{ messageId: "preferFind" }]
    },

    // --- prefer-constant: function returning a literal, used as callback ---
    {
      code: "xs.map(() => 42);",
      errors: [{ messageId: "preferLodash" }, { messageId: "preferConstant" }],
      output: "map(xs, () => 42);"
    },
    {
      code: "xs.map(() => 'hello');",
      errors: [{ messageId: "preferLodash" }, { messageId: "preferConstant" }],
      output: "map(xs, () => 'hello');"
    },
    {
      code: "xs.map(() => true);",
      errors: [{ messageId: "preferLodash" }, { messageId: "preferConstant" }],
      output: "map(xs, () => true);"
    },
    {
      code: "xs.map(() => null);",
      errors: [{ messageId: "preferLodash" }, { messageId: "preferConstant" }],
      output: "map(xs, () => null);"
    },

    // --- prefer-noop: empty function body, used as callback ---
    {
      code: "xs.then(() => {});",
      errors: [{ messageId: "preferNoop" }]
    },
    {
      code: "xs.catch(function() {});",
      errors: [{ messageId: "preferNoop" }]
    },

    // --- prefer-immutable-method ---
    {
      code: "_.pull(xs, 1)",
      errors: [
        {
          data: { method: "pull", preferred: "without" },
          messageId: "preferImmutable"
        }
      ]
    },
    {
      code: "_.remove(xs, (x) => x > 1)",
      errors: [
        {
          data: { method: "remove", preferred: "filter" },
          messageId: "preferImmutable"
        }
      ]
    },
    {
      code: "_.pullAll(xs, ys)",
      errors: [
        {
          data: { method: "pullAll", preferred: "difference" },
          messageId: "preferImmutable"
        }
      ]
    },
    {
      code: "_.pullAllBy(xs, ys, 'id')",
      errors: [
        {
          data: { method: "pullAllBy", preferred: "differenceBy" },
          messageId: "preferImmutable"
        }
      ]
    },
    {
      code: "_.pullAllWith(xs, ys, (a, b) => a === b)",
      errors: [
        {
          data: { method: "pullAllWith", preferred: "differenceWith" },
          messageId: "preferImmutable"
        }
      ]
    },
    {
      code: "_.pullAt(xs, [0, 1])",
      errors: [
        {
          data: { method: "pullAt", preferred: "filter" },
          messageId: "preferImmutable"
        }
      ]
    },
    {
      code: "pull(arr, item)",
      errors: [
        {
          data: { method: "pull", preferred: "without" },
          messageId: "preferImmutable"
        }
      ]
    },

    // --- prefer-reject: filter + negation -> reject ---
    {
      code: "xs.filter((x) => !x)",
      errors: [{ messageId: "preferReject" }]
    },
    {
      code: "xs.filter((x) => !(x > 1))",
      errors: [{ messageId: "preferReject" }]
    },

    // --- prefer-over-quantifier: && / || predicates -> overEvery / overSome ---
    {
      code: "xs.filter((x) => x > 1 && x < 10)",
      errors: [
        { data: { lodash: "overEvery" }, messageId: "preferOverQuantifier" }
      ]
    },
    {
      code: "xs.filter((x) => x < 1 || x > 10)",
      errors: [
        { data: { lodash: "overSome" }, messageId: "preferOverQuantifier" }
      ]
    },
    {
      code: "xs.filter((x) => x ?? y)",
      errors: [{ messageId: "preferLodash" }],
      output: "filter(xs, (x) => x ?? y)"
    },

    // --- prefer-flat-map: map + flatten -> flatMap ---
    {
      code: "xs.map((x) => [x, x * 2]).flatten()",
      errors: [{ messageId: "preferFlatMap" }]
    },

    // --- prefer-times: Array(n).fill(0).map(fn) -> times(n, fn) ---
    {
      code: "Array(5).fill(0).map(() => 42)",
      errors: [{ messageId: "preferTimes" }, { messageId: "preferConstant" }]
    },

    // --- prefer-matches: && property checks -> isMatch ---
    {
      code: "xs.filter((x) => x.a === 1 && x.b === 2)",
      errors: [{ messageId: "preferMatches" }]
    },
    {
      code: "xs.filter((x) => x.a !== 1 && x.b !== 2)",
      errors: [{ messageId: "preferMatches" }]
    },
    {
      code: "xs.filter((x) => (x.a === 1 && x.b === 2) && x.c === 3)",
      errors: [{ messageId: "preferMatches" }]
    },
    {
      // shouldPreferMatches returns false because the top-level operator
      // is not && — exercises the top-level guard inside isAllEqualityChecks.
      code: "xs.filter((x) => (x.a === 1 || x.b === 2) && x.c === 3)",
      errors: [
        { data: { lodash: "overEvery" }, messageId: "preferOverQuantifier" }
      ]
    },
    {
      // The right subtree is `||` — exercises the non-&& guard inside
      // processAllEqualityLeaf.
      code: "xs.filter((x) => ((x.a === 1 && x.b === 2) || x.c === 3))",
      errors: [
        { data: { lodash: "overSome" }, messageId: "preferOverQuantifier" }
      ]
    },
    {
      // A leaf that is neither equality nor LogicalExpression (a comparison
      // `>` here) trips the `return isEqualityComparison(current)` branch.
      code: "xs.filter((x) => x.a > 1)",
      errors: [{ messageId: "preferLodash" }],
      output: "filter(xs, (x) => x.a > 1)"
    },

    // --- prefer-invoke-map: map calling a method -> invokeMap ---
    {
      code: "xs.map((x) => x.camelCase())",
      errors: [{ messageId: "preferInvokeMap" }]
    },
    {
      // Sparse array hole in invoke-map iteratee exercises getChildNodes non-node array item
      code: "xs.map((x) => x.camelCase([, x]))",
      errors: [{ messageId: "preferInvokeMap" }]
    },
    {
      code: "xs.filter((x) => x > 1)[1]",
      errors: [{ messageId: "preferLodash" }],
      output: "filter(xs, (x) => x > 1)[1]"
    },
    {
      code: "xs.map((x) => x.camelCase().trim())",
      errors: [
        { messageId: "preferLodash" },
        { messageId: "preferLodash" },
        { messageId: "preferLodashMethod" },
        { messageId: "preferLodash" }
      ],
      output: "map(xs, (x) => x.camelCase().trim())"
    },
    {
      code: "xs.map(function(x) { return x.camelCase(); })",
      errors: [{ messageId: "preferInvokeMap" }]
    },
    {
      code: "xs.map((x) => x)",
      errors: [{ messageId: "preferLodash" }],
      output: "map(xs, (x) => x)"
    },
    {
      code: "xs.map(({ a }) => a.camelCase())",
      errors: [{ messageId: "preferLodash" }, { messageId: "preferLodash" }],
      output: "map(xs, ({ a }) => a.camelCase())"
    },
    {
      code: "xs.map((x) => y.camelCase())",
      errors: [{ messageId: "preferLodash" }, { messageId: "preferLodash" }],
      output: "map(xs, (x) => y.camelCase())"
    },
    {
      code: "xs.map(42)",
      errors: [{ messageId: "preferLodash" }],
      output: "map(xs, 42)"
    },
    {
      code: "xs.map(() => { })",
      errors: [{ messageId: "preferLodash" }, { messageId: "preferNoop" }],
      output: "map(xs, () => { })"
    },
    {
      code: "xs.map((x) => foo(x))",
      errors: [{ messageId: "preferLodash" }],
      output: "map(xs, (x) => foo(x))"
    },
    {
      code: "xs.filter(42)",
      errors: [{ messageId: "preferLodash" }],
      output: "filter(xs, 42)"
    },
    {
      code: "xs.filter((x) => x > 1)",
      errors: [{ messageId: "preferLodash" }],
      output: "filter(xs, (x) => x > 1)"
    },
    {
      code: "xs.filter(({a}) => typeof a === 'string')",
      errors: [
        { messageId: "preferLodash" },
        {
          data: { lodash: "isString", native: "typeof" },
          messageId: "preferTypecheck"
        }
      ],
      output: "filter(xs, ({a}) => typeof a === 'string')"
    },
    {
      code: "xs.map()",
      errors: [{ messageId: "preferLodash" }],
      output: "map(xs)"
    },
    {
      code: "xs.filter()",
      errors: [{ messageId: "preferLodash" }],
      output: "filter(xs)"
    },
    {
      code: "xs.filter(() => {})",
      errors: [{ messageId: "preferLodash" }, { messageId: "preferNoop" }],
      output: "filter(xs, () => {})"
    }
  ],
  valid: [
    {
      code: "xs.fromIterable(other);"
    },
    {
      code: 'import map from "lodash/map.js"; map([1, 2, 3], (x) => x * 2);'
    },
    {
      code: "Array.map([1, 2, 3], (x) => x * 2);"
    },
    {
      code: UNKNOWN_METHOD
    },
    {
      code: "Effect.succeed(1);"
    },
    {
      code: "xs[0]();"
    },
    {
      code: "const fn = () => {}; fn();"
    },
    {
      code: "xs.forEach((x) => { foo(); if (x) { y.push(x); } });"
    },
    {
      code: "xs.forEach((x) => { if (x) y.push(x); });"
    },
    {
      code: "xs.forEach((x) => { if (x) { foo(); y.push(x); } });"
    },
    {
      code: "xs.forEach(42);"
    },
    {
      code: "xs.forEach();"
    },
    {
      code: "xs.forEach((x) => { x; });"
    },
    {
      code: "if (typeof x !== 'undefined' || x === null) { return; }"
    },
    {
      code: "typeof x === y"
    },
    {
      code: "typeof x === 'bigint'"
    },
    {
      code: "foo(42)"
    },
    {
      code: "const fn = () => 42;"
    },
    {
      code: "function fn() {}"
    },
    {
      code: "1 + 2;"
    },

    // --- New patterns: valid cases ---
    {
      code: "isNil(x);"
    },
    {
      code: "isString(x);"
    },
    {
      code: "includes(xs, item);"
    },
    {
      code: "xs.includes(item);"
    },
    {
      code: "startsWith(str, 'foo');"
    },
    {
      code: "compact(xs);"
    },
    {
      code: "some(xs, (x) => x > 1);"
    },
    {
      code: "get(a, 'b.c');"
    },
    {
      code: "map(xs, (x) => x * 2);"
    },
    {
      code: "const fn = () => { return Math.random(); };"
    },
    {
      code: "const fn = () => { doSomething(); }"
    },
    {
      code: "function fn() { return x + y; }"
    },
    {
      code: "const fn = () => { if (x > 1) { return x; } return 0; };"
    },
    {
      code: "xs.forEach((x) => { console.log(x); });"
    },
    {
      code: "_.filter(xs, (x) => x);"
    },
    {
      code: "typeof x === 'symbol'"
    },
    {
      code: "if (x === null) { return; }"
    },
    {
      code: "if (x === undefined) { return; }"
    },
    {
      code: "foo((x) => x)"
    },
    {
      code: UNKNOWN_METHOD,
      options: [{ chainStyle: "always", importStyle: "deep" }]
    },
    {
      code: UNKNOWN_METHOD,
      options: [{ chainStyle: "as-needed" }]
    },
    {
      code: UNKNOWN_METHOD,
      options: [{ importStyle: "deep" }]
    },
    {
      // Two independent properties of the same object — not a progressive chain
      code: "if (part.type && part.value) { foo(); }"
    },
    {
      // Different identifiers — not a progressive chain
      code: "const x = a && b.c;"
    },
    {
      // Non-member in chain — not a progressive chain
      code: "const x = a && b && b.c;"
    },
    {
      // Non-array native method chain (database.update().set()) — should not flag
      code: "database.update(table).set({ name: 'foo' });"
    },
    {
      // drizzle ORM operators.eq — should not flag
      code: "operators.eq(table.userId, userId);"
    },
    {
      // drizzle ORM .orderBy — should not flag
      code: "database.select().from(table).orderBy(table.column);"
    },
    {
      // drizzle ORM .groupBy on a query builder chain — should not flag
      code: "database.select().from(table).where(condition).groupBy(table.id).as('sub');"
    },
    {
      // Array.prototype.join — should not flag
      code: "['a', 'b'].join(', ');"
    },
    {
      // Iterator.prototype.toArray — should not flag
      code: "new Map([['a', 1]]).keys().toArray();"
    },
    {
      // Response.prototype.clone — should not flag
      code: "const res = new Response(); res.clone();"
    },
    {
      // Set.prototype.add — should not flag
      code: "const s = new Set(); s.add(1);"
    },
    {
      // Number.prototype.toString — should not flag
      code: "const n = 42; n.toString();"
    },
    {
      // Schema.filter — Effect namespace, should not flag
      code: 'import { Schema } from "effect"; Schema.filter(stream, (x) => x);'
    },
    {
      // Non-effect import + Effect namespace — covers isEffectImportedIdentifier branches
      code: 'import { Schema } from "effect"; import { foo } from "other"; Schema.filter(stream, (x) => x);'
    },
    {
      // Cloudflare Workflow binding .create() — should not flag as prefer-lodash
      code: "workflowBinding.create({ id: workflowId });"
    },
    {
      // lodash `create` is object-category; calling it on an arbitrary object
      // should not trigger prefer-lodash (it's not an Array.prototype method)
      code: "const binding = {}; binding.create({ id: 'foo' });"
    },
    {
      // Computed member access with a variable — should not flag
      // (the property is a variable reference, not a method name)
      code: "const obj = { map: (x) => x }; const method = 'map'; obj[method](1);"
    },
    {
      // CSS.escape() is a browser API, not a lodash method
      code: "CSS.escape('foo');"
    },
    {
      // performance.now() is a Web API, not Array.prototype.now — lodash's
      // `now` is an alias for Date.now() and would silently break timing code.
      code: "const t = performance.now();"
    }
  ]
});
