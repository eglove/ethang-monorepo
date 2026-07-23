# Effect/Lodash Rule Backlog — `packages/eslint-plugin`

> **Precedence policy.** When lodash and Effect both offer an equivalent, **prefer the lodash form**. This applies across the `Array`, `Predicate`, `String`, `Number`, `Object`, `RegExp`, etc. modules. Effect is only the right answer when lodash has no equivalent at all.
>
> **Skip rules already covered.** `prefer-lodash` (the umbrella rule) and its pattern-specific messageIds already cover: `preferCompact`, `preferFilter`, `preferFind`, `preferFlatMap`, `preferIsNil`, `preferMap`, `preferTypecheck`, `preferTimes`, `preferSome`, `preferReject`, `preferStartsWith`, `preferIncludes`, `preferGet`, `preferNoop`, `preferConstant`, `preferMatches`, `preferOverQuantifier`, `preferInvokeMap`, `preferImmutable`, plus `preferUniq`, `preferUnzip`, `preferZip`, `preferPartition`, `preferCountBy`, `preferKeyBy`, `preferChunk`, `preferIsEmpty`. Additionally, dedicated rules exist for: `prefer-lodash-clamp`, `prefer-lodash-group-by`, `prefer-lodash-find-key`, `prefer-lodash-from-pairs`, `prefer-lodash-slice`, `prefer-lodash-union`, `prefer-lodash-intersection`, `prefer-lodash-difference`, `prefer-lodash-uniq`, `prefer-lodash-count-by`, `prefer-lodash-key-by`, `prefer-lodash-escape-regexp`, `prefer-effect-datetime`, `prefer-effect-encoding-base64`, `prefer-effect-log`, `prefer-effect-predicate`, `prefer-effect-predicate-is-iterable`. See `packages/eslint-plugin/src/rules/` and `packages/eslint-plugin/src/utils/prefer-patterns.ts`.
>
> **Severity convention.** "Report-only" means *no autofix* — **not** a lower severity. Every rule in `@ethang/eslint-config` is registered at ESLint's default severity of `error` (never `warn` or `off`); new rules follow the same convention. A "report-only" rule still fails the build; the user is responsible for the migration and `--fix` simply does not rewrite the source.

## Convention

- **Sev**: `S` = safe/autofix, `P` = policy/semantic-shift.
- **Fix**: ✅ full · ⚠ partial · ❌ report-only.
- **Effort**: `S` = short, `M` = medium, `L` = large.

---

## Effect `Array`

| # | Rule | Why | Sev | Fix | Effort |
|---|---|---|---|---|---|
| 1 | `prefer-effect-array-fromIterable` / `prefer-effect-array-make` / `prefer-effect-array-allocate` | `[...iter]` / `Array.from(iter)` / `new Array(n).fill(0)` → `Array.fromIterable` / `Array.make` / `Array.allocate` | S | ✅ | M |
| 2 | `prefer-effect-array-intersperse` | `[a, ...bs, c, ...ds]` interleaving → `Array.intersperse` | S | ✅ | S |
| 3 | `prefer-effect-array-scan` | Running fold accumulator → `Array.scan` / `scanRight` | S | ✅ | S |

## Lodash

| # | Rule | Why | Sev | Fix | Effort |
|---|---|---|---|---|---|
| 6 | `prefer-lodash-sortBy` / `prefer-lodash-orderBy` | `arr.sort((a,b) => ...)` → `sortBy(arr, fn)` / `orderBy(arr, [fn], ["asc"])`. Include ES2023 non-mutating coverage: `toSorted`, `toReversed`, `toSpliced`. | S | ⚠ | M |
| 12 | `prefer-lodash-pick` | `const { a, b } = obj` → `pick(obj, ["a","b"])` | S | ✅ | S |
| 13 | `prefer-lodash-omit` | `const { a, ...rest } = obj` → `omit(obj, ["a"])` | S | ✅ | S |
| 22 | `prefer-lodash-trim` / `prefer-lodash-trimStart` / `prefer-lodash-trimEnd` | Native `s.trim()` / `trimStart()` / `trimEnd()` → `trim(s, chars?)` etc. | S | ⚠ | M |
| 23 | (removed — `prefer-lodash-escape-regexp` implemented) | — | — | — | — |

## Effect (non-array — lodash has no equivalent)

| # | Rule | Why | Sev | Fix | Effort |
|---|---|---|---|---|---|
| 25 | `prefer-effect-number-parse` | `Number(x)` / `parseFloat(x)` → `Number.parse(x)` (returns `Option<number>`, fails safely) | S | ✅ | S |
| 26 | `prefer-effect-duration-millis` | `n * 1000` in `setTimeout(fn, n)` / `Date.now() - ts` → `Duration.millis(n)` / `Duration.seconds(n)` | S | ⚠ | M |
| 27 | `prefer-effect-bigint-clamp` | Ternary clamp on bigints → `BigInt.clamp(x, {min, max})` | S | ✅ | S |
| 29 | `prefer-effect-redacted` | String literal flagged as secret → `Redacted.make(value)` (heuristic) | S | ❌ | M |

## Policy-driven (report-only by default — semantic-shift migrations)

| # | Rule | Why | Sev | Fix | Effort |
|---|---|---|---|---|---|
| 33 | `prefer-effect-option` | `T \| null`/`T \| undefined` signatures → `Option<T>` | P | ❌ | L |
| 34 | `prefer-effect-stream` | Async generators → `Stream.asyncEffect(...)` | P | ❌ | L |
| 35 | `prefer-effect-stm` | Mutable `Ref`+CAS patterns → `STM` | P | ❌ | L |
| 36 | `prefer-effect-schedule` | `setInterval(fn, n)` → `Effect.repeat(Schedule.spaced(Duration.millis(n)))` | P | ❌ | L |
| 37 | `prefer-effect-match` | Long `switch` / `if-else` chains → `Match.tags` / `Match.type`. Always prefer `effect.match` over `switch`. Existing rules like `sonar/no-small-switch` and `unicorn/prefer-switch` already govern if/else vs switch decision. | P | ❌ | L |
| 38 | `prefer-effect-pub-sub` | Mutex/lock around broadcast → `PubSub.publish/subscribe` | P | ❌ | L |
| 39 | `prefer-effect-config` | `process.env.X ?? default` → `Config.string("X").pipe(Config.withDefault(default))` | P | ❌ | L |
| 40 | `prefer-effect-pool` | Manual resource limit → `Pool.make` / `KeyedPool.make` | P | ❌ | L |
| 41 | `prefer-effect-cause` | `instanceof Error` checks → `Cause.failureOption(...)` | P | ❌ | L |
| 42 | `prefer-effect-data` | Hand-rolled error classes → `Data.TaggedError` / `Data.TaggedClass` | P | ❌ | L |
| 43 | `prefer-lodash-debounce/throttle/memoize` | Hand-rolled equivalents → lodash equivalents | P | ⚠ | M |
| 45 | `prefer-lodash-mapKeys` | `Object.fromEntries(Object.entries(o).map(...))` → `mapKeys(o, fn)` | P | ✅ | S |
| 46 | `prefer-lodash-mapValues` | `Object.fromEntries(Object.entries(o).map(...))` (value-only) → `mapValues(o, fn)` | P | ✅ | S |
| 47 | `prefer-lodash-merge` | Hand-rolled recursive merge → `merge(a, b)` | P | ❌ | L |
| 48 | `prefer-effect-tracer` | Manual `performance.now()` spans → `Effect.withSpan("name")` | P | ❌ | L |

## Cross-cutting helpers (report-only)

| # | Helper | Why |
|---|---|---|
| H1 | `prefer-effect-equal` | `JSON.stringify(a) === JSON.stringify(b)` → `Equal.equals(a, b)` |
| H2 | `prefer-effect-hash` | Primary-key comparisons in maps/sets → `Hash.hash(a) === Hash.hash(b)` |
| H3 | `prefer-effect-order` | `a.x < b.x ? -1 : a.x > b.x ? 1 : 0` → `Order.make(...)` / `Order.number` |

## Meta-rule extensions to `prefer-lodash`

Not new rules — extending the umbrella rule's `lodashApi` / `nativeAliases` tables so the generic `preferLodash` messageId fires on additional native shapes.

| # | Extension | Note |
|---|---|---|
| M3 | `preferLodash` on `arr.head()` / `arr.last()` (via `Array.prototype.at` nativeAliases) | ⚠️ `at` is in `NATIVE_EQUIVALENT_METHODS` — would need that removed first. |
| M4 | `preferLodash` on `Object.keys/values/entries` | ⚠️ `keys` / `values` / `entries` are in `NATIVE_EQUIVALENT_METHODS` — would need those removed first. Open policy question. |

---

## Open risks / gotchas

1. **Iteratee-contract parity.** Lodash supports path shorthand (`filter(arr, "user.name")`); Effect `Array.filter` / `Predicate.*` do not. Autofixes must refuse or expand path shorthand first.
2. **Data-first vs data-last.** Effect helpers are data-last (`String.trim(s)`); native `s.trim()` is data-first. Autofix requires arrow-wrap (`String.trim(() => s.trim())`), which breaks in non-pure contexts (`Promise.then`, `Effect.map`).
3. **Type widening.** `Number.parse(x)` returns `Option<number>`, not `number`. Autofixing `Number(x)` forces downstream `Option.match` — likely report-only.
4. **`Option<T>` migration.** Replacing nullable signatures touches every consumer — strictly report-only.
5. **100% coverage discipline.** Every new branch needs a test. `v8 ignore next` requires proof the branch is unreachable from the producer — see [ast-v8-to-istanbul docs](https://github.com/AriPerkkio/ast-v8-to-istanbul#ignoring-code).
6. **Umbrella `reportArray` fixer does not insert imports.** When a new pattern ships, the user adds the lodash import manually (e.g. `import isEmpty from "lodash/isEmpty.js"`).
7. **`NATIVE_EQUIVALENT_METHODS` is the lodash-wins enforcement point.** Removing entries from `packages/eslint-plugin/src/utils/ast.ts` is the policy decision that flips native calls from "allowed" to "reportable" — needs explicit user buy-in per method.
8. **No explicit return type annotations.** The eslint config's autofix removes `: Type` annotations on functions. Use iterative loops instead of recursion to avoid the `TS7023` cascading-any error that arises from recursive functions without an explicit return type.
9. **Top-of-file constants.** Repeat string literals appearing 3+ times must be extracted to a top-of-file `const` (sonar/no-duplicate-string threshold).
