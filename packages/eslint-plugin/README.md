# @ethang/eslint-plugin

Custom ESLint plugin that encodes ethang-monorepo standards: prefer Effect, prefer lodash, no try/catch, no barrel files, and no explicit return types.

Replaces `eslint-plugin-lodash` with full lodash API surface coverage, proper Effect/lodash disambiguation, and additional monorepo-specific rules.

## Installation

```bash
pnpm add -D @ethang/eslint-plugin
```

## Usage

```js
import eslintPlugin from "@ethang/eslint-plugin";

export default {
  plugins: {
    "@ethang": eslintPlugin
  },
  rules: {
    "@ethang/chain-style": "error",
    "@ethang/chaining": "error",
    "@ethang/consistent-compose": "error",
    "@ethang/identity-shorthand": "error",
    "@ethang/import-scope": ["error", "method-package"],
    "@ethang/matches-property-shorthand": "error",
    "@ethang/matches-shorthand": "error",
    "@ethang/no-barrel-file": "error",
    "@ethang/no-collection-issues": "error",
    "@ethang/no-explicit-return-type": "error",
    "@ethang/no-lodash-misuse": "error",
    "@ethang/no-null-undefined-check": "error",
    "@ethang/no-try-catch": "error",
    "@ethang/path-style": "error",
    "@ethang/prefer-effect": "error",
    "@ethang/prefer-lodash": "error",
    "@ethang/preferred-alias": "error",
    "@ethang/property-shorthand": "error",
        "@ethang/unwrap": "error",
        "@ethang/validate-unknown": "error"
      }
    };
```

## Rules

### Prefer rules

| Rule | Description | Auto-fix |
| --- | --- | --- |
| `prefer-effect` | Prefer `effect` (Array module) over native Array.prototype methods when an equivalent exists. | Yes |
| `prefer-lodash` | Prefer lodash (full API surface) over Array.prototype / Object.* / native methods when an equivalent exists. | Yes |

### No rules

| Rule | Description | Auto-fix |
| --- | --- | --- |
| `no-barrel-file` | Ban barrel files (`index.ts` that re-exports from siblings). Imports must come from the source file directly. | No |
| `no-collection-issues` | Detects lodash collection issues: missing return values, unnecessary unwrap, and chain method values used outside chains. | No |
| `no-lodash-misuse` | Detect common lodash misuse: calling `.commit()` on chains, double unwrap via `.value().value()`, passing extra arguments to single-arg functions, and using `this` in iteratees without binding. | No |
| `no-explicit-return-type` | Ban all explicit return type annotations (per AGENTS.md rule 6). Auto-fix removes the annotation. | Yes |
| `no-try-catch` | Ban `try`/`catch`/`throw`. Use the Effect typed error system (`Effect.try`, `Effect.tryPromise`, `Effect.catchTag`, `Effect.catchAll`, `Effect.fail`) instead. | No |
| `validate-unknown` | Require that calls returning `unknown`/`any` (e.g. `JSON.parse`, `response.json()`, `fetch(...)`) are validated by an Effect Schema (`Schema.decodeUnknown*` / `Schema.is` / `Schema.validate*` / `S.decode*` family) before being used downstream. | No |

### Stylistic rules

| Rule | Description | Auto-fix |
| --- | --- | --- |
| `chain-style` | Enforce a specific chain style for lodash methods. | Yes |
| `chaining` | Check if a lodash expression could be better expressed as a chain. | Yes |
| `consistent-compose` | Enforce a consistent composition direction (flow/pipe vs flowRight/compose). | Yes |
| `identity-shorthand` | Prefer omitting the iteratee when an identity function is used (e.g. `filter(xs)` over `filter(xs, x => x)`). | Yes |
| `import-scope` | Enforce a specific Lodash import scope (method, member, full, or method-package). | Yes |
| `matches-property-shorthand` | Prefer matches-property shorthand syntax (e.g. `filter(xs, ['key', value])` over `filter(xs, x => x.key === value)`). | Yes |
| `matches-shorthand` | Prefer matches shorthand syntax (e.g. `filter(xs, { active: true })` over `filter(xs, x => x.active === true)`). | Yes |
| `path-style` | Enforce consistent path style (array or string) for lodash path methods. | Yes |
| `preferred-alias` | Prefer canonical lodash method names over aliases (e.g. `forEach` over `each`). | Yes |
| `property-shorthand` | Prefer property shorthand syntax (e.g. `map(xs, 'name')` over `map(xs, x => x.name)`). | Yes |
| `unwrap` | Require lodash chains to end with a chain-breaking method. | No |

## Import convention

This plugin assumes deep-import style for lodash:

```js
import map from "lodash/map.js";
import filter from "lodash/filter.js";
```

Never use `_.method()` or `import _ from "lodash"`. The `import-scope` rule enforces this.
