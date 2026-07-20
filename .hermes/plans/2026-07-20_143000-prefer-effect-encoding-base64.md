# prefer-effect-encoding-base64 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add an ESLint rule `prefer-effect-encoding-base64` that flags the Node `Buffer`-based
base64 encode/decode idioms and autofixes them to Effect's `Encoding.encodeBase64` / `Encoding.decodeBase64`.

**Architecture:** A self-contained rule in `packages/eslint-plugin/src/rules/`. It exposes a pure
`detect*` helper (no ESLint dependency) so it can be unit-tested with vitest, plus a `RuleTester`
integration test. The detector recognizes two shapes: `Buffer.from(x).toString("base64")`
(encode → `Encoding.encodeBase64(x)`) and `Buffer.from(x, "base64").toString()` (decode →
`Encoding.decodeBase64(x)`). The autofix rewrites the call; per repo convention it does NOT insert
the `import { Encoding } from "effect"` (the user adds that, mirroring how lodash umbrella fixes leave
imports to the user — see AGENTS.md note #6). Severity is `error`, fully autofixable (`fixable: "code"`).

**Tech Stack:** TypeScript, `@typescript-eslint/utils` (`ESLintUtils`, `TSESTree`), vitest, ESLint `RuleTester`, `typescript-eslint` parser. Effect `Encoding` is the target API (its names already exist in `effectEncodingApi` from Wave 0).

**Backlog reference:** Rule #28 in `effect-lodash-rule-backlog.md`. Precedence policy: lodash wins when
an equivalent exists; base64 has NO lodash equivalent, so Effect is the correct target. `Buffer`,
`btoa`, `atob` are NOT in `NATIVE_EQUIVALENT_METHODS` (`packages/eslint-plugin/src/utils/ast.ts:306`),
so a dedicated rule does not conflict with the umbrella `prefer-lodash`.

**Scope / non-goals (engineering judgment, AGENTS.md rule #1):**
- Only the Node `Buffer` idioms are in scope. `btoa`/`atob` are deliberately EXCLUDED: `btoa` operates
  on Latin1 binary strings while Effect's `Encoding.encodeBase64` is UTF-8, so a naive rewrite would
  change behavior for non-ASCII input. Document this as a non-goal rather than shipping a silent bug.
- `new Buffer(x).toString("base64")` is out of scope (we require `Buffer.from`).
- The autofix does not add the `effect` import; the user must add `import { Encoding } from "effect";`.

---

## Files

- Create: `packages/eslint-plugin/src/rules/prefer-effect-encoding-base64.ts`
- Create: `packages/eslint-plugin/src/rules/prefer-effect-encoding-base64.test.ts`   (RuleTester)
- Create: `packages/eslint-plugin/src/rules/prefer-effect-encoding-base64-unit.test.ts` (vitest unit)
- Modify: `packages/eslint-plugin/src/index.ts`   (import + `rules` map + named export)
- Modify: `packages/eslint-plugin/src/index.test.ts` (sorted rule-name assertion)
- Modify: `packages/eslint-config/src/config.main.js` (enable the rule as `error`)

---

## Task 1: Write the failing unit test for the detectors

**Objective:** Lock the detection contract before writing any implementation (Red).

**Files:**
- Create: `packages/eslint-plugin/src/rules/prefer-effect-encoding-base64-unit.test.ts`

**Step 1: Write the test file**

```typescript
import { describe, expect, it } from "vitest";

import {
  detectDecodeBase64Pattern,
  detectEncodeBase64Pattern,
  detectEncodingBase64Pattern
} from "./prefer-effect-encoding-base64.ts";
import { findCall } from "./.fixture.ts";

const encodeSamples = [
  "Buffer.from(s).toString(\"base64\")",
  "Buffer.from(name + \"!\").toString(\"base64\")",
  "Buffer.from(getRaw()).toString(\"base64\")"
];

const decodeSamples = [
  "Buffer.from(s, \"base64\").toString()",
  "Buffer.from(s, \"base64\").toString(\"utf8\")",
  "Buffer.from(s, \"base64\").toString(\"utf-8\")"
];

describe("prefer-effect-encoding-base64", () => {
  describe("detectEncodeBase64Pattern", () => {
    it.each(encodeSamples)("detects encode shape %s", (code) => {
      const { call } = findCall(code);
      const result = detectEncodeBase64Pattern(call);
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("encode");
    });

    it("returns null for a non-base64 toString", () => {
      const { call } = findCall("Buffer.from(s).toString(\"hex\")");
      expect(detectEncodeBase64Pattern(call)).toBeNull();
    });

    it("returns null for Buffer.from with no toString arg", () => {
      const { call } = findCall("Buffer.from(s).toString()");
      expect(detectEncodeBase64Pattern(call)).toBeNull();
    });

    it("returns null for toString on a non-Buffer receiver", () => {
      const { call } = findCall("foo.toString(\"base64\")");
      expect(detectEncodeBase64Pattern(call)).toBeNull();
    });

    it("returns null for new Buffer (not Buffer.from)", () => {
      const { call } = findCall("new Buffer(s).toString(\"base64\")");
      expect(detectEncodeBase64Pattern(call)).toBeNull();
    });

    it("returns null for Buffer.from with two args (not a plain encode)", () => {
      const { call } = findCall("Buffer.from(s, \"utf8\").toString(\"base64\")");
      expect(detectEncodeBase64Pattern(call)).toBeNull();
    });
  });

  describe("detectDecodeBase64Pattern", () => {
    it.each(decodeSamples)("detects decode shape %s", (code) => {
      const { call } = findCall(code);
      const result = detectDecodeBase64Pattern(call);
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("decode");
    });

    it("returns null when the inner encoding arg is not base64", () => {
      const { call } = findCall("Buffer.from(s, \"utf8\").toString()");
      expect(detectDecodeBase64Pattern(call)).toBeNull();
    });

    it("returns null when toString receives a non-utf8 encoding arg", () => {
      const { call } = findCall("Buffer.from(s, \"base64\").toString(\"hex\")");
      expect(detectDecodeBase64Pattern(call)).toBeNull();
    });

    it("returns null for a bare Buffer.from encode call", () => {
      const { call } = findCall("Buffer.from(s).toString(\"base64\")");
      expect(detectDecodeBase64Pattern(call)).toBeNull();
    });
  });

  describe("detectEncodingBase64Pattern (combined)", () => {
    it.each(encodeSamples)("classifies encode %s", (code) => {
      const { call } = findCall(code);
      expect(detectEncodingBase64Pattern(call)?.kind).toBe("encode");
    });

    it.each(decodeSamples)("classifies decode %s", (code) => {
      const { call } = findCall(code);
      expect(detectEncodingBase64Pattern(call)?.kind).toBe("decode");
    });

    it("returns null for an unrelated call", () => {
      const { call } = findCall("arr.map((x) => x * 2)");
      expect(detectEncodingBase64Pattern(call)).toBeNull();
    });
  });
});
```

**Step 2: Run the unit test to confirm it fails (Red)**

Run: `cd /c/Users/glove/projects/ethang-monorepo && pnpm --filter @ethang/eslint-plugin exec vitest run prefer-effect-encoding-base64-unit`

Expected: FAIL — `Cannot find module './prefer-effect-encoding-base64.ts'` (the rule file does not exist yet).

---

## Task 2: Implement the detectors (Green for unit tests)

**Objective:** Make `detectEncodeBase64Pattern`, `detectDecodeBase64Pattern`, `detectEncodingBase64Pattern` return the right shape.

**Files:**
- Create: `packages/eslint-plugin/src/rules/prefer-effect-encoding-base64.ts`

**Step 1: Write the rule implementation (detectors only first; the `createRule` block comes in Task 4)**

Write the full file now (detectors + rule) so Task 3's RuleTester compiles:

```typescript
import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

import { isCallExpression, isIdentifier, isMemberExpression } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferEffectEncodingBase64";

type Options = [];

const BUFFER = "Buffer";
const FROM = "from";
const TO_STRING = "toString";
const BASE64 = "base64";
const UTF8 = "utf8";
const UTF8_HYPHEN = "utf-8";

// `Buffer.from(...)` with a non-computed `Buffer.from` member on the global
// `Buffer` identifier. Returns the argument list, or null. Computed access
// (`Buffer["from"]`) and a shadowed `Buffer` are both rejected.
const getBufferFromArguments = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return null;
  }
  const { callee } = node;
  if (!isMemberExpression(callee)) {
    return null;
  }
  if (callee.computed) {
    return null;
  }
  const { object, property } = callee;
  if (!isIdentifier(object) || BUFFER !== object.name) {
    return null;
  }
  if (!isIdentifier(property) || FROM !== property.name) {
    return null;
  }
  return node.arguments;
};

export type EncodingMatch = {
  readonly arg: TSESTree.Expression;
  readonly kind: "decode" | "encode";
};

// `Buffer.from(x).toString("base64")` -> { kind: "encode", arg: x }
export const detectEncodeBase64Pattern = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return null;
  }
  const { callee } = node;
  if (!isMemberExpression(callee) || callee.computed) {
    return null;
  }
  if (!isIdentifier(callee.property) || TO_STRING !== callee.property.name) {
    return null;
  }
  if (1 !== node.arguments.length) {
    return null;
  }
  const [encodingArg] = node.arguments;
  if (!encodingArg || AST_NODE_TYPES.Literal !== encodingArg.type) {
    return null;
  }
  if (BASE64 !== encodingArg.value) {
    return null;
  }
  const bufferArgs = getBufferFromArguments(callee.object);
  if (!bufferArgs || 1 !== bufferArgs.length) {
    return null;
  }
  const [input] = bufferArgs;
  if (!input || !isCallExpression(input) && !isIdentifier(input)) {
    return null;
  }
  return { arg: input as TSESTree.Expression, kind: "encode" } as EncodingMatch;
};

// `Buffer.from(x, "base64").toString()` / `.toString("utf8" | "utf-8")`
// -> { kind: "decode", arg: x }
export const detectDecodeBase64Pattern = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return null;
  }
  const { callee } = node;
  if (!isMemberExpression(callee) || callee.computed) {
    return null;
  }
  if (!isIdentifier(callee.property) || TO_STRING !== callee.property.name) {
    return null;
  }
  if (1 < node.arguments.length) {
    return null;
  }
  const [encodingArg] = node.arguments;
  if (encodingArg) {
    if (AST_NODE_TYPES.Literal !== encodingArg.type) {
      return null;
    }
    if (UTF8 !== encodingArg.value && UTF8_HYPHEN !== encodingArg.value) {
      return null;
    }
  }
  const bufferArgs = getBufferFromArguments(callee.object);
  if (!bufferArgs || 2 !== bufferArgs.length) {
    return null;
  }
  const [input, innerEncoding] = bufferArgs;
  if (!input || !innerEncoding) {
    return null;
  }
  if (AST_NODE_TYPES.Literal !== innerEncoding.type) {
    return null;
  }
  if (BASE64 !== innerEncoding.value) {
    return null;
  }
  return { arg: input, kind: "decode" } as EncodingMatch;
};

export const detectEncodingBase64Pattern = (node: TSESTree.Node) => {
  return detectEncodeBase64Pattern(node) ?? detectDecodeBase64Pattern(node);
};

const formatEncodingCall = (kind: "decode" | "encode", argText: string) => {
  return "encode" === kind
    ? `Encoding.encodeBase64(${argText})`
    : `Encoding.decodeBase64(${argText})`;
};

const buildEncodingFix = (
  sourceCode: TSESLint.SourceCode,
  fixer: TSESLint.RuleFixer,
  node: TSESTree.CallExpression,
  match: EncodingMatch
) => {
  const argText = sourceCode.getText(match.arg);
  return fixer.replaceText(node, formatEncodingCall(match.kind, argText));
};

export const preferEffectEncodingBase64Rule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;
    return {
      CallExpression: (node) => {
        const match = detectEncodingBase64Pattern(node);
        if (!match) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildEncodingFix(sourceCode, fixer, node, match);
          },
          messageId: "preferEffectEncodingBase64",
          node
        });
      }
    };
  },
  defaultOptions: [],
  fixable: "code",
  meta: {
    docs: {
      description:
        "Prefer `Encoding.encodeBase64` / `Encoding.decodeBase64` over `Buffer`-based base64 idioms."
    },
    fixable: "code",
    messages: {
      preferEffectEncodingBase64:
        "Prefer `Encoding.encodeBase64` / `Encoding.decodeBase64` (from `effect`) over `Buffer.from(...).toString(\"base64\")`. Add `import { Encoding } from \"effect\";` after applying the fix."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-encoding-base64"
});
```

**Step 2: Run the unit test (Green)**

Run: `pnpm --filter @ethang/eslint-plugin exec vitest run prefer-effect-encoding-base64-unit`

Expected: PASS (all `it.each` cases + negatives).

---

## Task 3: Write the RuleTester integration test (autofix coverage)

**Objective:** Prove the rule fires on real source and the autofix produces the expected `Encoding.*` call.

**Files:**
- Create: `packages/eslint-plugin/src/rules/prefer-effect-encoding-base64.test.ts`

**Step 1: Write the RuleTester test**

```typescript
import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectEncodingBase64Rule } from "./prefer-effect-encoding-base64.ts";

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
  "prefer-effect-encoding-base64",
  preferEffectEncodingBase64Rule as never,
  {
    invalid: [
      {
        code: "const x = Buffer.from(s).toString(\"base64\");",
        errors: [{ messageId: "preferEffectEncodingBase64" }],
        output: "const x = Encoding.encodeBase64(s);"
      },
      {
        code: "const x = Buffer.from(name + \"!\").toString(\"base64\");",
        errors: [{ messageId: "preferEffectEncodingBase64" }],
        output: "const x = Encoding.encodeBase64(name + \"!\");"
      },
      {
        code: "const x = Buffer.from(s, \"base64\").toString();",
        errors: [{ messageId: "preferEffectEncodingBase64" }],
        output: "const x = Encoding.decodeBase64(s);"
      },
      {
        code: "const x = Buffer.from(s, \"base64\").toString(\"utf8\");",
        errors: [{ messageId: "preferEffectEncodingBase64" }],
        output: "const x = Encoding.decodeBase64(s);"
      }
    ],
    valid: [
      { code: "const x = Encoding.encodeBase64(s);" },
      { code: "const x = Encoding.decodeBase64(s);" },
      { code: "const x = Buffer.from(s).toString(\"hex\");" },
      { code: "const x = Buffer.from(s).toString();" },
      { code: "const x = Buffer.from(s, \"utf8\").toString();" },
      { code: "const x = Buffer.from(s, \"base64\").toString(\"hex\");" },
      { code: "const x = foo.toString(\"base64\");" },
      { code: "const x = new Buffer(s).toString(\"base64\");" },
      { code: "const x = btoa(s);" }
    ]
  }
);
```

**Step 2: Run the integration test**

Run: `pnpm --filter @ethang/eslint-plugin exec vitest run prefer-effect-encoding-base64.test`

Expected: PASS — 4 invalid cases autofix to the `output` exactly; 9 valid cases produce no error.

---

## Task 4: Register the rule everywhere

**Objective:** Make the rule loadable by the plugin and enabled in the shared config (no missing-export / name-list test failures).

**Files:**
- Modify: `packages/eslint-plugin/src/index.ts`
- Modify: `packages/eslint-plugin/src/index.test.ts`
- Modify: `packages/eslint-config/src/config.main.js`

**Step 1: Add the import (alphabetically, after `prefer-effect-datetime`)**

In `packages/eslint-plugin/src/index.ts`, after line 17 (`import { preferEffectDateTimeRule } ...`):
```typescript
import { preferEffectEncodingBase64Rule } from "./rules/prefer-effect-encoding-base64.ts";
```

**Step 2: Add to the `rules` object (after `"prefer-effect-datetime": ...`)**
```typescript
  "prefer-effect-encoding-base64": preferEffectEncodingBase64Rule,
```

**Step 3: Add the named re-export (after `export { preferEffectDateTimeRule } ...`)**
```typescript
export { preferEffectEncodingBase64Rule } from "./rules/prefer-effect-encoding-base64.ts";
```

**Step 4: Add the name to the sorted assertion in `index.test.ts`**

In the expected array, insert `"prefer-effect-encoding-base64"` between `"prefer-effect-datetime"` and `"prefer-effect-log"`:
```typescript
        "prefer-effect-datetime",
        "prefer-effect-encoding-base64",
        "prefer-effect-log",
```

**Step 5: Enable the rule in the shared config**

In `packages/eslint-config/src/config.main.js`, insert after line 50 (`"@ethang/prefer-effect-datetime": "error",`):
```javascript
      "@ethang/prefer-effect-encoding-base64": "error",
```

**Step 6: Re-run the plugin's own index test to confirm registration**

Run: `pnpm --filter @ethang/eslint-plugin exec vitest run src/index.test.ts`

Expected: PASS — `"exports the expected rule names"` now includes `prefer-effect-encoding-base64`.

---

## Task 5: Build + full check + commit

**Objective:** Ensure the built `dist` exposes the rule (eslint-config loads the package's dist), then run the monorepo checker scoped to this workspace and commit.

**Step 1: Build the eslint-plugin package (regenerates dist consumed by eslint-config)**

Run: `pnpm --filter @ethang/eslint-plugin build`

Expected: exit 0, dist rebuilt.

**Step 2: Run the scoped monorepo quality check**

Run: `pnpm --filter @ethang/monorepo-tools check --workspace @ethang/eslint-plugin --file packages/eslint-plugin/src/rules/prefer-effect-encoding-base64.ts`

Expected: the `@ethang/eslint-plugin` workspace passes (lint clean — note the rule's `meta.fixable`
and `fixable: "code"` both set, no `no-restricted-syntax` violations; tsc clean; vitest green for the
new unit + integration tests). Read the `lint.autofix` block if anything was rewritten and re-run.

**Step 3: Commit**

```bash
git add packages/eslint-plugin/src/rules/prefer-effect-encoding-base64.ts \
        packages/eslint-plugin/src/rules/prefer-effect-encoding-base64.test.ts \
        packages/eslint-plugin/src/rules/prefer-effect-encoding-base64-unit.test.ts \
        packages/eslint-plugin/src/index.ts \
        packages/eslint-plugin/src/index.test.ts \
        packages/eslint-config/src/config.main.js
git commit -m "feat(eslint-plugin): add prefer-effect-encoding-base64 rule (Buffer -> Effect Encoding)"
```

---

## Tests / validation summary

- `pnpm --filter @ethang/eslint-plugin exec vitest run prefer-effect-encoding-base64-unit` → detectors pass (encode/decode/combined + negatives).
- `pnpm --filter @ethang/eslint-plugin exec vitest run prefer-effect-encoding-base64.test` → RuleTester invalid autofix + valid cases pass.
- `pnpm --filter @ethang/eslint-plugin exec vitest run src/index.test.ts` → rule-name registry assertion passes.
- `pnpm --filter @ethang/monorepo-tools check --workspace @ethang/eslint-plugin --file packages/eslint-plugin/src/rules/prefer-effect-encoding-base64.ts` → lint + tsc + vitest green.

## Risks / tradeoffs / open questions

1. **Import not auto-added.** The fix produces `Encoding.encodeBase64(x)` but does NOT add
   `import { Encoding } from "effect"`. This is consistent with repo convention (AGENTS.md note #6:
   fixers don't insert imports; the user adds them). The message tells the user to add the import.
   Tradeoff: autofixed code won't typecheck until the import is added — acceptable per repo policy.
2. **btoa / atob excluded on purpose.** `btoa` is Latin1; Effect `Encoding.encodeBase64` is UTF-8.
   Auto-rewriting would corrupt non-ASCII input, so they are valid (non-flagged) cases. Documented as
   a deliberate scope boundary, not a missing branch.
3. **100% coverage.** Every detector branch is exercised by the `it.each` negatives in Task 1 plus the
   RuleTester valid/invalid sets. No `v8 ignore` needed — all branches are reachable.
4. **`meta.fixable` + top-level `fixable`** both set to `"code"` to match sibling autofix rules
   (`prefer-lodash-clamp`, `prefer-lodash-union`).
5. **Shadowed `Buffer`** is not distinguished (we only check the identifier name `Buffer`). Acceptable
   for a lint heuristic; matching the existing `isMathMemberCall` approach in `prefer-lodash-clamp.ts`.
