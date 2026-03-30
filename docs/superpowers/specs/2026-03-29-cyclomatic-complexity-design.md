# Cyclomatic Complexity Remediation — Design Spec

**Date:** 2026-03-29
**Status:** Approved

---

## Background

`sonar/cyclomatic-complexity` was enabled (threshold 10) by removing the `"off"` override from
`packages/eslint-config/src/setup/sonar.ts`. Six files violate the threshold. Three of those
files also carry `// eslint-disable-next-line sonar/cognitive-complexity` inline suppression
comments that must be removed and fixed.

---

## Rule Conflict Resolution

No conflict exists between `sonar/cyclomatic-complexity` and `eslint/complexity`.
`eslint/complexity` is explicitly `"off"` in `packages/eslint-config/src/setup/eslint.ts:26`.

`sonar/cyclomatic-complexity` (threshold 10) and `sonar/cognitive-complexity` (threshold 15)
are complementary rules that measure different things:
- **Cyclomatic**: counts the number of linearly independent paths through a function
- **Cognitive**: weights nesting depth more heavily — measures how hard the code is to read

Both rules remain enabled. No config changes are needed.

---

## Violations Inventory

| File | Cyclomatic | Cognitive disable? |
|---|---|---|
| `apps/ethang-hono/src/components/button/button-classes.ts` | 14 | no |
| `apps/ethang-hono/src/components/portable-text.tsx` | 21 | yes |
| `apps/sterett-hono/src/components/pages/calendar-page.tsx` | 14 | no |
| `packages/toolbelt/src/events/cosmos.ts` | 22 | yes |
| `packages/toolbelt/src/intl/get-locale.ts` | 12 | no |
| `packages/leetcode/src/waterfall-streams/waterfall-streams.ts` | 12 | yes |

---

## TDD Protocol

Applied to every file, in order:

1. Check whether existing tests already cover the function's observable behavior
2. If not, write failing Vitest tests that pin the current behavior before touching any implementation
3. Refactor to reduce cyclomatic complexity below threshold 10
4. Run tests — green means the refactor preserved behavior
5. Remove any `// eslint-disable-next-line sonar/cognitive-complexity` comment
6. Run lint and confirm zero violations

For UI components:
- **Unit tests** (Vitest) cover extracted logic helpers and pure class-name functions
- **Playwright** covers observable behavior and user interactions

---

## Architecture Principles

- **DDD** for pure backend/domain logic — class-driven, private methods, domain language
- **Atomic Design** for frontend — small named renderers, dispatch maps, thin orchestrators
- All LeetCode violations are fully refactored (no threshold overrides, no suppression comments)

---

## Per-file Strategy

### `button-classes.ts` (complexity 14) — Atomic / lookup table

**Problem:** One function contains two `switch` statements (variant + size), totalling 14 branches.

**Fix:** Replace both `switch` blocks with two lookup maps:
```ts
const VARIANT_CLASSES: Record<ButtonVariant, Set<string>> = { ... }
const SIZE_CLASSES: Record<ButtonSize, Set<string>> = { ... }
```
The function body becomes: look up variant classes, look up size classes, union, return.
Projected complexity: ~3.

**Tests:** Vitest unit tests asserting the returned class array for each variant × size combination.

---

### `portable-text.tsx` (complexity 21, cognitive disable) — Atomic / block-type dispatch

**Problem:** An anonymous `map` callback handles 7+ block types with nested style branches,
accumulates list items via mutable closure state, and has no named sub-functions.

**Fix:**
1. Extract a `BLOCK_RENDERERS: Record<string, (block, ctx) => Child>` map keyed by `block._type`
2. For the `"block"` type, a nested `STYLE_RENDERERS: Record<string, (block, ctx) => Child>` maps `block.style` → renderer
3. Extract `renderListItem` to handle the mutable `blockItems` accumulation
4. Extract `renderChildren` to its own named function (already partially done)
5. The outer `map` callback becomes: `BLOCK_RENDERERS[block._type]?.(block, ctx) ?? null`
6. Remove `// eslint-disable-next-line sonar/cognitive-complexity`

Projected complexity: ~3 per function.

**Tests:** Vitest unit tests per renderer function; Playwright for full rendering of a rich-text fixture.

---

### `calendar-page.tsx` (complexity 14) — Atomic / extract pure computation functions

**Problem:** The component function body performs data setup (nav config, prefetch URLs,
cross-view date derivation, month/week/day locals) inline, accumulating 14 branches.

**Fix:** Extract pure computation functions:
- `buildNavConfig(view, date, year, month, today, ...)` → nav headings, hrefs, showToday flag
- `buildPrefetchUrls(navConfig, view, crossViewYear, crossViewMonth, crossViewDate)` → string[]
- `buildCrossViewDate(view, date, currentMonthDt)` → DateTime

The component becomes a thin template: call each function, pass results to JSX.
Projected complexity: ≤5 per function.

**Tests:** Vitest unit tests for `buildNavConfig` and `buildPrefetchUrls`; Playwright for page behavior.

---

### `cosmos.ts` (complexity 22, cognitive disable) — DDD / class private methods

**Problem:** `onEventListenerFilter` contains 6 priority checks that combine filter fields
(id, listener, eventName, options, target) in a long if/else chain. Complexity 22.

**Fix:** Extract each priority check into a named private predicate method:
- `private matchesById(id, listener, filters)`
- `private matchesByListenerAndEvent(listener, filters)`
- `private matchesByListenerAndEventAndOptions(listener, filters)`
- `private matchesByEventAndTarget(listener, filters)`
- `private matchesByAny(listener, filters)`
- `private matchesAll(filters)`

`onEventListenerFilter` becomes sequential dispatch through these predicates.
Projected complexity: 1–3 per method, ~6 for the dispatcher.

**Tests:** Vitest unit tests for each predicate via the public `off`/`has` API, covering each
priority path.

---

### `get-locale.ts` (complexity 12) — DDD / source handler map

**Problem:** `getLocale` iterates `sourceTypes` with 4 compound `if`-chains that check both
the source type and guard conditions (`!isNil(source)`, `!isNil(valueName)`, etc.).

**Fix:** Build a `Partial<Record<LocaleSource, () => string | null>>` from the available
arguments, then iterate and return the first non-null result:
```ts
const handlers: Partial<Record<LocaleSource, () => string | null>> = {
  ...(source && { "accept-language": () => getFromAcceptLanguage(source) }),
  ...(source && valueName && { cookie: () => getFromCookie(valueName, source) }),
  ...("undefined" !== typeof navigator && { navigator: () => navigator.language }),
  ...(valueName && "undefined" !== typeof localStorage && {
    localStorage: () => getFromLocalStorage(valueName),
  }),
};
for (const sourceType of sourceTypes) {
  const result = handlers[sourceType]?.();
  if (!isNil(result)) return result;
}
return null;
```
Projected complexity: ~3.

**Tests:** Vitest unit tests per source type (accept-language, cookie, navigator, localStorage).

---

### `waterfall-streams.ts` (complexity 12, cognitive disable) — pure function extraction

**Problem:** Two `while` loops (spread-right, spread-left) are nested inside the inner `for`
loop, making the algorithm hard to follow and pushing complexity to 12.

**Fix:** Extract:
- `spreadWaterRight(rowAbove, currentRow, index, splitWater): void`
- `spreadWaterLeft(rowAbove, currentRow, index, splitWater): void`

The main function body becomes readable prose. Remove `// eslint-disable-next-line sonar/cognitive-complexity`.
Projected complexity: ≤5 per function.

**Tests:** Existing `waterfall-streams.test.ts` covers the function; confirm green before refactoring.

---

## Worktree Strategy

The current branch has unstaged changes (the `sonar/cyclomatic-complexity` enable in `sonar.ts`
plus other package changes from git status). When moving to a git worktree:
1. Stash or copy the unstaged changes from the current branch
2. Create the worktree from the current branch (not main) so the ESLint changes are included
3. Apply the stashed changes in the worktree
4. All implementation happens in the worktree

---

## Success Criteria

- `sonar/cyclomatic-complexity` reports zero violations across all packages
- `sonar/cognitive-complexity` reports zero violations across all packages
- All `// eslint-disable-next-line sonar/cognitive-complexity` comments removed
- All existing tests remain green after each refactor
- `eslint/complexity` remains `"off"` (no change to ESLint config)
- No threshold overrides or suppression comments introduced
