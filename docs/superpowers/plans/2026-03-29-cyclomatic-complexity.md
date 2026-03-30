# Cyclomatic Complexity Remediation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all `sonar/cyclomatic-complexity` violations and all `// eslint-disable-next-line sonar/cognitive-complexity` suppressions across the monorepo.

**Architecture:** Each file is refactored using DDD (class-based private methods for domain/logic) or Atomic Design (dispatch maps and small named renderers for UI). TDD protocol applied to every file: confirm or write tests first, refactor, verify green.

**Tech Stack:** TypeScript, Vitest, Hono JSX, SonarJS ESLint plugin, pnpm workspaces, git worktrees

**Spec:** `docs/superpowers/specs/2026-03-29-cyclomatic-complexity-design.md`

---

## File Map

| Action | File | Notes |
|---|---|---|
| Modify | `apps/ethang-hono/src/components/button/button-classes.ts` | Replace two `switch` blocks with `Record` lookup maps |
| Modify | `apps/ethang-hono/src/components/portable-text.tsx` | Block-type dispatch map + style renderer map |
| Modify | `apps/sterett-hono/src/components/pages/calendar-page.tsx` | Delegate to extracted helpers |
| Create | `apps/sterett-hono/src/utils/calendar-nav.ts` | `buildNavConfig`, `buildPrefetchUrls`, `buildCrossViewDate` |
| Create | `apps/sterett-hono/src/utils/calendar-nav.test.ts` | Unit tests for the three new helpers |
| Modify | `packages/toolbelt/src/events/cosmos.ts` | Extract 6 private predicate methods |
| Create | `packages/toolbelt/src/events/cosmos.test.ts` | Unit tests covering all 6 filter priorities |
| Modify | `packages/toolbelt/src/intl/get-locale.ts` | Source-type handler map |
| Create | `packages/toolbelt/src/intl/get-locale.test.ts` | Unit tests per source type |
| Modify | `packages/leetcode/src/waterfall-streams/waterfall-streams.ts` | Extract `spreadWaterRight` + `spreadWaterLeft` |

---

## Task 0: Worktree Setup

- [ ] **Step 1: Stash all uncommitted changes from the current branch**

From the repo root (`C:\Users\glove\projects\ethang-monorepo`):

```powershell
git stash --include-untracked
```

Expected output: `Saved working directory and index state WIP on master: <hash> <message>`

- [ ] **Step 2: Create a new worktree from the current branch**

```powershell
git worktree add ..\ethang-monorepo-complexity master
```

Expected: a new directory `C:\Users\glove\projects\ethang-monorepo-complexity` checked out on master.

- [ ] **Step 3: Apply the stash in the worktree**

```powershell
Set-Location ..\ethang-monorepo-complexity
git stash pop
```

Expected: all changes from `git status` (package.json bumps, `pnpm-lock.yaml`, `sonar.ts` change, etc.) are present.

- [ ] **Step 4: Verify the ESLint change is present**

```powershell
git diff HEAD packages/eslint-config/src/setup/sonar.ts
```

Expected: diff shows the `cyclomatic-complexity` `"off"` line has been removed.

- [ ] **Step 5: Grep for all cognitive-complexity suppressions**

```powershell
Select-String -Path "apps\**\*.{ts,tsx}", "packages\**\*.{ts,tsx}" -Pattern "sonar/cognitive-complexity" -Recurse
```

Confirm the full list before starting. Known 3:
- `apps/ethang-hono/src/components/portable-text.tsx:67`
- `packages/toolbelt/src/events/cosmos.ts:200`
- `packages/leetcode/src/waterfall-streams/waterfall-streams.ts:8`

All remaining work happens inside `ethang-monorepo-complexity`.

---

## Task 1: `waterfall-streams.ts` — Pure Function Extraction

**Files:**
- Modify: `packages/leetcode/src/waterfall-streams/waterfall-streams.ts`
- Test: `packages/leetcode/src/waterfall-streams/waterfall-streams.test.ts` (exists)

- [ ] **Step 1: Confirm the existing test passes**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
pnpm --filter leetcode exec npx vitest run src/waterfall-streams/waterfall-streams.test.ts
```

Expected: 1 test passing. If it fails, stop — do not proceed until green.

- [ ] **Step 2: Replace `waterfall-streams.ts` with extracted helpers**

The current function has two `while` loops (spread-right and spread-left) nested inside a `for` loop. Extract them as module-level pure functions.

Full replacement for `packages/leetcode/src/waterfall-streams/waterfall-streams.ts`:

```ts
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

const spreadWaterRight = (
  rowAbove: number[],
  currentRow: number[],
  index: number,
  splitWater: number,
): void => {
  let rightIndex = index;

  // eslint-disable-next-line sonar/too-many-break-or-continue-in-loop
  while (rightIndex + 1 < rowAbove.length) {
    rightIndex += 1;

    if (1 === rowAbove[rightIndex]) {
      break;
    }

    if (1 !== currentRow[rightIndex]) {
      // @ts-expect-error ignore
      currentRow[rightIndex] += splitWater;
      break;
    }
  }
};

const spreadWaterLeft = (
  rowAbove: number[],
  currentRow: number[],
  index: number,
  splitWater: number,
): void => {
  let leftIndex = index;

  // eslint-disable-next-line sonar/too-many-break-or-continue-in-loop
  while (0 <= leftIndex - 1) {
    leftIndex -= 1;

    if (1 === rowAbove[leftIndex]) {
      break;
    }

    if (1 !== currentRow[leftIndex]) {
      // @ts-expect-error ignore
      currentRow[leftIndex] += splitWater;
      break;
    }
  }
};

export const waterfallStreams = (array: number[][], source: number) => {
  let rowAbove = [...get(array, [0])];
  rowAbove[source] = -1;

  for (let row = 1; row < array.length; row += 1) {
    const currentRow = [...get(array, [row])];

    // eslint-disable-next-line sonar/too-many-break-or-continue-in-loop
    for (const [index, valueAbove] of rowAbove.entries()) {
      const hasWaterAbove = 0 > valueAbove;
      const hasBlock = 1 === currentRow[index];

      if (!hasWaterAbove) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (!hasBlock && !isNil(currentRow[index])) {
        currentRow[index] += valueAbove;
        // eslint-disable-next-line no-continue
        continue;
      }

      const splitWater = valueAbove / 2;
      spreadWaterRight(rowAbove, currentRow, index, splitWater);
      spreadWaterLeft(rowAbove, currentRow, index, splitWater);
    }

    rowAbove = currentRow;
  }

  return map(rowAbove, (_number) => {
    return 0 > _number ? _number * -100 : _number;
  });
};
```

- [ ] **Step 3: Run the test to verify behavior is preserved**

```powershell
pnpm --filter leetcode exec npx vitest run src/waterfall-streams/waterfall-streams.test.ts
```

Expected: 1 test passing.

- [ ] **Step 4: Verify lint passes**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity\packages\leetcode
npx eslint src/waterfall-streams/
```

Expected: 0 errors, `sonar/cognitive-complexity` disable comment gone.

- [ ] **Step 5: Commit**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
git add packages/leetcode/src/waterfall-streams/waterfall-streams.ts
git commit -m "refactor(leetcode): extract spreadWaterRight/Left to fix cyclomatic complexity"
```

---

## Task 2: `get-locale.ts` — Source Handler Map

**Files:**
- Modify: `packages/toolbelt/src/intl/get-locale.ts`
- Create: `packages/toolbelt/src/intl/get-locale.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/toolbelt/src/intl/get-locale.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getLocale } from "./get-locale.ts";

describe(getLocale, () => {
  describe("accept-language source", () => {
    it("returns locale from Accept-Language header string", () => {
      const result = getLocale(["accept-language"], "en-US,en;q=0.9");

      expect(result).toBe("en-US");
    });

    it("returns null when source is not provided", () => {
      const result = getLocale(["accept-language"]);

      expect(result).toBeNull();
    });

    it("falls through to the next source when accept-language source is absent", () => {
      vi.stubGlobal("navigator", { language: "fr-FR" });
      const result = getLocale(["accept-language", "navigator"]);

      expect(result).toBe("fr-FR");
      vi.unstubAllGlobals();
    });
  });

  describe("cookie source", () => {
    it("returns null when source and valueName are not provided", () => {
      const result = getLocale(["cookie"]);

      expect(result).toBeNull();
    });

    it("returns null when source is missing", () => {
      const result = getLocale(["cookie"], undefined, "locale");

      expect(result).toBeNull();
    });
  });

  describe("navigator source", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", { language: "de-DE" });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns navigator.language", () => {
      const result = getLocale(["navigator"]);

      expect(result).toBe("de-DE");
    });
  });

  describe("localStorage source", () => {
    beforeEach(() => {
      vi.stubGlobal("localStorage", {
        getItem: vi.fn().mockReturnValue("ja-JP"),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns value from localStorage", () => {
      const result = getLocale(["localStorage"], undefined, "locale");

      expect(result).toBe("ja-JP");
    });

    it("returns null when valueName is not provided", () => {
      const result = getLocale(["localStorage"]);

      expect(result).toBeNull();
    });
  });

  it("returns null when no source type matches", () => {
    const result = getLocale(["navigator"]);

    expect(result).toBeNull();
  });

  it("respects source type order — first matching wins", () => {
    vi.stubGlobal("navigator", { language: "es-ES" });
    const result = getLocale(["navigator", "accept-language"], "en-US");

    expect(result).toBe("es-ES");
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
pnpm --filter @ethang/toolbelt exec npx vitest run src/intl/get-locale.test.ts
```

Expected: FAIL — `get-locale.test.ts` not yet importable from test (the file exists but tests run against current implementation, most will pass. If they pass, proceed to step 3.)

- [ ] **Step 3: Replace `get-locale.ts` with handler map**

Full replacement for `packages/toolbelt/src/intl/get-locale.ts`:

```ts
import attempt from "lodash/attempt.js";
import get from "lodash/get.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { getCookieValue } from "../http/cookie.ts";
import { getAcceptLanguage } from "../http/headers.ts";

type LocaleSource = "accept-language" | "cookie" | "localStorage" | "navigator";

type LocaleHandler = (
  source?: Readonly<Headers | string>,
  valueName?: Readonly<string>,
) => string | null | undefined;

const acceptLanguageHandler: LocaleHandler = (source) => {
  return isNil(source) ? undefined : getFromAcceptLanguage(source);
};

const cookieHandler: LocaleHandler = (source, valueName) => {
  return isNil(source) || isNil(valueName)
    ? undefined
    : getFromCookie(valueName, source);
};

const navigatorHandler: LocaleHandler = () => {
  return "undefined" === typeof navigator ? undefined : navigator.language;
};

const localStorageHandler: LocaleHandler = (_, valueName) => {
  return isNil(valueName) || "undefined" === typeof localStorage
    ? undefined
    : getFromLocalStorage(valueName);
};

const SOURCE_HANDLERS: Record<LocaleSource, LocaleHandler> = {
  "accept-language": acceptLanguageHandler,
  "cookie": cookieHandler,
  "localStorage": localStorageHandler,
  "navigator": navigatorHandler,
};

export const getLocale = (
  sourceTypes: readonly LocaleSource[],
  source?: Readonly<Headers | string>,
  valueName?: Readonly<string>,
) => {
  for (const sourceType of sourceTypes) {
    const result = SOURCE_HANDLERS[sourceType](source, valueName);

    if (undefined !== result) {
      return result;
    }
  }

  return null;
};

const getFromAcceptLanguage = (source: Readonly<Headers | string>) => {
  const value = getAcceptLanguage(source);

  if (isError(value)) {
    return null;
  }

  let language = get(value, [0, "language"]);
  const country = get(value, [0, "country"]);

  if (!isNil(language)) {
    if (!isNil(country)) {
      language += `-${country}`;
    }

    return language;
  }

  return null;
};

const getFromCookie = (
  valueName: string,
  source: Readonly<Headers | string>,
) => {
  const value = getCookieValue(valueName, source);

  if (!isError(value)) {
    return value;
  }

  return null;
};

const getFromLocalStorage = (valueName: string) => {
  const value = attempt(localStorage.getItem.bind(localStorage), valueName);

  if (!isNil(value) && !isError(value)) {
    return value;
  }

  return null;
};
```

- [ ] **Step 4: Run tests to verify they pass**

```powershell
pnpm --filter @ethang/toolbelt exec npx vitest run src/intl/get-locale.test.ts
```

Expected: all tests passing.

- [ ] **Step 5: Verify lint**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity\packages\toolbelt
npx eslint src/intl/get-locale.ts
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
git add packages/toolbelt/src/intl/get-locale.ts packages/toolbelt/src/intl/get-locale.test.ts
git commit -m "refactor(toolbelt): replace get-locale if-chain with source handler map"
```

---

## Task 3: `button-classes.ts` — Lookup Tables

**Files:**
- Modify: `apps/ethang-hono/src/components/button/button-classes.ts`
- Test: `apps/ethang-hono/src/components/button/button-classes.test.ts` (exists — comprehensive)

- [ ] **Step 1: Confirm existing tests pass**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
pnpm --filter ethang-hono exec npx vitest run src/components/button/button-classes.test.ts
```

Expected: all tests passing. If not, stop and investigate.

- [ ] **Step 2: Replace the two `switch` blocks with `Record` lookup maps**

The two `switch` statements in `getButtonClasses` each add 8+ branches. Replace them with pre-built lookup maps. The class `Set` constants above the function remain unchanged.

Replace only the `getButtonClasses` function (lines 108–185) in `apps/ethang-hono/src/components/button/button-classes.ts`:

```ts
const VARIANT_CLASSES: Record<ButtonVariant, Set<string>> = {
  danger: dangerClasses,
  dark: darkClasses,
  default: defaultClasses,
  ghost: ghostClasses,
  secondary: secondaryClasses,
  success: successClasses,
  tertiary: tertiaryClasses,
  warning: warningClasses,
};

const SIZE_CLASSES: Record<ButtonSize, Set<string>> = {
  base: new Set(),
  lg: largeClasses,
  sm: smallClasses,
  xl: xLargeClasses,
  xs: extraSmallClasses,
};

const SIZES_WITHOUT_LEADING = new Set<ButtonSize>(["lg", "xl"]);

export const getButtonClasses = (
  variant: ButtonVariant,
  size: ButtonSize = "base",
) => {
  let classSet = new Set(baseClasses).union(VARIANT_CLASSES[variant]);
  classSet = classSet.union(SIZE_CLASSES[size]);

  if (SIZES_WITHOUT_LEADING.has(size)) {
    classSet.delete("leading-5");
  }

  return [...classSet];
};
```

- [ ] **Step 3: Run tests to confirm behavior preserved**

```powershell
pnpm --filter ethang-hono exec npx vitest run src/components/button/button-classes.test.ts
```

Expected: all tests passing.

- [ ] **Step 4: Verify lint**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity\apps\ethang-hono
npx eslint src/components/button/button-classes.ts
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
git add apps/ethang-hono/src/components/button/button-classes.ts
git commit -m "refactor(ethang-hono): replace button-classes switch blocks with Record lookup maps"
```

---

## Task 4: `calendar-page.tsx` — Extract Pure Navigation Helpers

**Files:**
- Create: `apps/sterett-hono/src/utils/calendar-nav.ts`
- Create: `apps/sterett-hono/src/utils/calendar-nav.test.ts`
- Modify: `apps/sterett-hono/src/components/pages/calendar-page.tsx`

- [ ] **Step 1: Confirm existing calendar-page tests pass**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
pnpm --filter sterett-hono exec npx vitest run src/components/pages/calendar-page.test.ts
```

Expected: 3 tests passing.

- [ ] **Step 2: Write failing tests for the helpers to be extracted**

Create `apps/sterett-hono/src/utils/calendar-nav.test.ts`:

```ts
import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import {
  buildCrossViewDate,
  buildNavConfig,
  buildPrefetchUrls,
} from "./calendar-nav.ts";

const CHICAGO = "America/Chicago";

describe(buildCrossViewDate, () => {
  it("returns currentMonthDt for month view", () => {
    const currentMonthDt = DateTime.fromObject(
      { day: 1, month: 6, year: 2024 },
      { zone: CHICAGO },
    );
    const result = buildCrossViewDate("month", "2024-06-15", currentMonthDt);

    expect(result.toISODate()).toBe("2024-06-01");
  });

  it("returns date-parsed DateTime for week view", () => {
    const currentMonthDt = DateTime.fromObject(
      { day: 1, month: 6, year: 2024 },
      { zone: CHICAGO },
    );
    const result = buildCrossViewDate("week", "2024-06-15", currentMonthDt);

    expect(result.toISODate()).toBe("2024-06-15");
  });

  it("returns date-parsed DateTime for day view", () => {
    const currentMonthDt = DateTime.fromObject(
      { day: 1, month: 6, year: 2024 },
      { zone: CHICAGO },
    );
    const result = buildCrossViewDate("day", "2024-06-15", currentMonthDt);

    expect(result.toISODate()).toBe("2024-06-15");
  });
});

describe(buildNavConfig, () => {
  const baseArgs = {
    date: "2024-06-15",
    isCurrentMonth: false,
    isCurrentWeek: false,
    isToday: false,
    month: 6,
    monthName: "June",
    nextMonth: 7,
    nextYear: 2024,
    previousMonth: 5,
    previousYear: 2024,
    today: "2024-06-01",
    year: 2024,
  };

  it("day view: heading uses formatDayHeading output format", () => {
    const config = buildNavConfig({ ...baseArgs, view: "day" });

    expect(config.heading).toContain("June");
    expect(config.heading).toContain("2024");
  });

  it("day view: nextHref shifts date by 1", () => {
    const config = buildNavConfig({ ...baseArgs, view: "day" });

    expect(config.nextHref).toBe("/calendar?view=day&date=2024-06-16");
  });

  it("day view: prevHref shifts date by -1", () => {
    const config = buildNavConfig({ ...baseArgs, view: "day" });

    expect(config.prevHref).toBe("/calendar?view=day&date=2024-06-14");
  });

  it("day view: showToday is true when not viewing today", () => {
    const config = buildNavConfig({ ...baseArgs, view: "day", isToday: false });

    expect(config.showToday).toBe(true);
  });

  it("day view: showToday is false when viewing today", () => {
    const config = buildNavConfig({ ...baseArgs, view: "day", isToday: true });

    expect(config.showToday).toBe(false);
  });

  it("month view: heading includes month name and year", () => {
    const config = buildNavConfig({ ...baseArgs, view: "month" });

    expect(config.heading).toBe("June 2024");
  });

  it("month view: nextHref uses next month/year", () => {
    const config = buildNavConfig({ ...baseArgs, view: "month" });

    expect(config.nextHref).toBe("/calendar?view=month&year=2024&month=7");
  });

  it("month view: showToday is false when viewing current month", () => {
    const config = buildNavConfig({
      ...baseArgs,
      view: "month",
      isCurrentMonth: true,
    });

    expect(config.showToday).toBe(false);
  });

  it("week view: showToday is false when viewing current week", () => {
    const config = buildNavConfig({
      ...baseArgs,
      view: "week",
      isCurrentWeek: true,
    });

    expect(config.showToday).toBe(false);
  });
});

describe(buildPrefetchUrls, () => {
  const navConfig = {
    heading: "June 2024",
    nextHref: "/calendar?view=month&year=2024&month=7",
    prevHref: "/calendar?view=month&year=2024&month=5",
    showToday: false,
    todayHref: "/calendar?view=month&year=2024&month=6",
  };
  const hrefs = {
    tabDayHref: "/calendar?view=day&date=2024-06-15",
    tabMonthHref: "/calendar?view=month&year=2024&month=6",
    tabWeekHref: "/calendar?view=week&date=2024-06-15",
  };

  it("always includes prev and next hrefs", () => {
    const urls = buildPrefetchUrls(navConfig, "month", hrefs);

    expect(urls).toContain(navConfig.prevHref);
    expect(urls).toContain(navConfig.nextHref);
  });

  it("month view: excludes tabMonthHref", () => {
    const urls = buildPrefetchUrls(navConfig, "month", hrefs);

    expect(urls).not.toContain(hrefs.tabMonthHref);
    expect(urls).toContain(hrefs.tabWeekHref);
    expect(urls).toContain(hrefs.tabDayHref);
  });

  it("week view: excludes tabWeekHref", () => {
    const urls = buildPrefetchUrls(navConfig, "week", hrefs);

    expect(urls).not.toContain(hrefs.tabWeekHref);
    expect(urls).toContain(hrefs.tabMonthHref);
  });

  it("day view: excludes tabDayHref", () => {
    const urls = buildPrefetchUrls(navConfig, "day", hrefs);

    expect(urls).not.toContain(hrefs.tabDayHref);
    expect(urls).toContain(hrefs.tabMonthHref);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```powershell
pnpm --filter sterett-hono exec npx vitest run src/utils/calendar-nav.test.ts
```

Expected: FAIL — `calendar-nav.ts` does not exist yet.

- [ ] **Step 4: Create `calendar-nav.ts` with the three helper functions**

Create `apps/sterett-hono/src/utils/calendar-nav.ts`:

```ts
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";

import {
  formatDayHeading,
  formatWeekHeading,
  shiftDate,
} from "./calendar.ts";

const CHICAGO = "America/Chicago";

type CalendarView = "day" | "month" | "week";

export type NavConfig = {
  heading: string;
  nextHref: string;
  prevHref: string;
  showToday: boolean;
  todayHref: string;
};

type BuildNavConfigArgs = {
  date: string;
  isCurrentMonth: boolean;
  isCurrentWeek: boolean;
  isToday: boolean;
  month: number;
  monthName: string;
  nextMonth: number;
  nextYear: number;
  previousMonth: number;
  previousYear: number;
  today: string;
  view: CalendarView;
  year: number;
};

type TabHrefs = {
  tabDayHref: string;
  tabMonthHref: string;
  tabWeekHref: string;
};

export const buildCrossViewDate = (
  view: CalendarView,
  date: string,
  currentMonthDt: DateTime,
): DateTime => {
  return "month" === view
    ? currentMonthDt
    : DateTime.fromISO(date, { zone: CHICAGO });
};

export const buildNavConfig = ({
  date,
  isCurrentMonth,
  isCurrentWeek,
  isToday,
  month,
  monthName,
  nextMonth,
  nextYear,
  previousMonth,
  previousYear,
  today,
  view,
  year,
}: BuildNavConfigArgs): NavConfig => {
  const NAV_CONFIGS: Record<CalendarView, NavConfig> = {
    day: {
      heading: formatDayHeading(date),
      nextHref: `/calendar?view=day&date=${shiftDate(date, 1)}`,
      prevHref: `/calendar?view=day&date=${shiftDate(date, -1)}`,
      showToday: !isToday,
      todayHref: `/calendar?view=day&date=${today}`,
    },
    month: {
      heading: `${monthName} ${year}`,
      nextHref: `/calendar?view=month&year=${nextYear}&month=${nextMonth}`,
      prevHref: `/calendar?view=month&year=${previousYear}&month=${previousMonth}`,
      showToday: !isCurrentMonth,
      todayHref: `/calendar?view=month&year=${year}&month=${month}`,
    },
    week: {
      heading: formatWeekHeading(date),
      nextHref: `/calendar?view=week&date=${shiftDate(date, 7)}`,
      prevHref: `/calendar?view=week&date=${shiftDate(date, -7)}`,
      showToday: !isCurrentWeek,
      todayHref: `/calendar?view=week&date=${today}`,
    },
  };

  return NAV_CONFIGS[view];
};

export const buildPrefetchUrls = (
  navConfig: NavConfig,
  view: CalendarView,
  { tabDayHref, tabMonthHref, tabWeekHref }: TabHrefs,
): string[] => {
  return filter(
    [
      navConfig.prevHref,
      navConfig.nextHref,
      "month" === view ? null : tabMonthHref,
      "week" === view ? null : tabWeekHref,
      "day" === view ? null : tabDayHref,
    ],
    (value) => !isNil(value),
  ) as string[];
};
```

- [ ] **Step 5: Run the new helper tests — verify green**

```powershell
pnpm --filter sterett-hono exec npx vitest run src/utils/calendar-nav.test.ts
```

Expected: all tests passing.

- [ ] **Step 6: Update `calendar-page.tsx` to use the extracted helpers**

Replace the body of `CalendarPage` in `apps/sterett-hono/src/components/pages/calendar-page.tsx` so it delegates to the new helpers. Keep all imports, add the three new imports at the top:

```ts
import {
  buildCrossViewDate,
  buildNavConfig,
  buildPrefetchUrls,
} from "../../utils/calendar-nav.ts";
```

Replace the `crossViewDt`/`crossViewDate`/`navConfig`/`prefetch` locals with calls to the helpers. The updated component body (after the existing data-fetching locals `weeks`, `currentMonthDt`, etc.) becomes:

```ts
  const crossViewDt = buildCrossViewDate(view, date, currentMonthDt);
  const crossViewDate = crossViewDt.toISODate();
  if (isNil(crossViewDate))
    throw new Error("Could not determine cross-view date");

  const crossViewYear = crossViewDt.year;
  const crossViewMonth = crossViewDt.month;

  const navLinkClass =
    "inline-flex min-h-6 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors";

  const tabMonthHref = `/calendar?view=month&year=${crossViewYear}&month=${crossViewMonth}`;
  const tabWeekHref = `/calendar?view=week&date=${crossViewDate}`;
  const tabDayHref = `/calendar?view=day&date=${crossViewDate}`;

  const navConfig = buildNavConfig({
    date,
    isCurrentMonth,
    isCurrentWeek,
    isToday,
    month,
    monthName,
    nextMonth,
    nextYear,
    previousMonth,
    previousYear,
    today,
    view,
    year,
  });

  const prefetch = buildPrefetchUrls(navConfig, view, {
    tabDayHref,
    tabMonthHref,
    tabWeekHref,
  });
```

The JSX return block and all other locals remain unchanged.

- [ ] **Step 7: Run all calendar-page tests**

```powershell
pnpm --filter sterett-hono exec npx vitest run src/components/pages/calendar-page.test.ts src/utils/calendar-nav.test.ts
```

Expected: all tests passing.

- [ ] **Step 8: Verify lint**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity\apps\sterett-hono
npx eslint src/components/pages/calendar-page.tsx src/utils/calendar-nav.ts
```

Expected: 0 errors.

- [ ] **Step 9: Commit**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
git add apps/sterett-hono/src/utils/calendar-nav.ts apps/sterett-hono/src/utils/calendar-nav.test.ts apps/sterett-hono/src/components/pages/calendar-page.tsx
git commit -m "refactor(sterett-hono): extract calendar nav helpers to fix cyclomatic complexity"
```

---

## Task 5: `portable-text.tsx` — Block-Type Dispatch Map

**Files:**
- Modify: `apps/ethang-hono/src/components/portable-text.tsx`
- Test: `apps/ethang-hono/src/components/portable-text.test.tsx` (exists — comprehensive)

- [ ] **Step 1: Confirm existing tests pass**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
pnpm --filter ethang-hono exec npx vitest run src/components/portable-text.test.tsx
```

Expected: all 20 tests passing.

- [ ] **Step 2: Replace `portable-text.tsx` with dispatch-map refactor**

The current anonymous `map` callback (complexity 21) is replaced by named renderer functions and a type-dispatch map. The `renderChildren` function and all imports remain. The `// eslint-disable-next-line sonar/cognitive-complexity` comment is removed.

Full replacement for `apps/ethang-hono/src/components/portable-text.tsx`:

```tsx
import type { Child } from "hono/jsx";

import filter from "lodash/filter.js";
import find from "lodash/find.js";
import flatMap from "lodash/flatMap.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";

import type { GetBlogBySlug } from "../models/get-blog-by-slug.ts";

import { Image } from "../image.tsx";
import { Code } from "./code.tsx";
import { Blockquote } from "./typography/blockquote.tsx";
import { H2 } from "./typography/h2.tsx";
import { H3 } from "./typography/h3.tsx";
import { InlineCode } from "./typography/inline-code.tsx";
import { Link } from "./typography/link.tsx";
import { List } from "./typography/list.tsx";
import { P } from "./typography/p.tsx";
import { YouTubeVideo } from "./you-tube-video.tsx";

type Body = GetBlogBySlug["body"];
type Block = Body[number];
type BlockChildren = NonNullable<Block["children"]>;

type PortableTextProperties = {
  children: Body;
};

type RenderContext = {
  allChildren: Body;
  renderChildren: (nodeChildren: BlockChildren | undefined) => ReturnType<typeof map>;
};

const STYLE_RENDERERS: Record<string, (block: Block, ctx: RenderContext) => Child> = {
  blockquote: (block, ctx) => (
    // @ts-expect-error ignore
    <Blockquote
      author={block.author}
      source={block.source}
      sourceUrl={block.sourceUrl}
    >
      {ctx.renderChildren(block.children)}
    </Blockquote>
  ),
  h2: (block, ctx) => <H2>{ctx.renderChildren(block.children)}</H2>,
  h3: (block, ctx) => (
    <H3 className="mt-4">{ctx.renderChildren(block.children)}</H3>
  ),
  normal: (block, ctx) => <P>{ctx.renderChildren(block.children)}</P>,
};

const renderImageBlock = (block: Block): Child => {
  if (isNil(block.asset?.url)) {
    return null;
  }

  return (
    // @ts-expect-error ignore
    <Image
      alt={block.alt ?? ""}
      src={block.asset.url}
      caption={block.caption}
      width={block.asset.metadata.dimensions.width}
      height={block.asset.metadata.dimensions.height}
    />
  );
};

const renderCodeBlock = (block: Block): Child => {
  if (isNil(block.code)) {
    return null;
  }

  return (
    <Code language={block.language ?? "typescript"}>{block.code}</Code>
  );
};

const renderVideoBlock = (block: Block): Child => {
  if (isNil(block.videoId)) {
    return null;
  }

  return (
    <YouTubeVideo videoId={block.videoId} title={block.title ?? ""} />
  );
};

const renderQuoteBlock = (block: Block): Child => {
  if (isNil(block.quote)) {
    return null;
  }

  return (
    // @ts-expect-error ignore
    <Blockquote
      author={block.author}
      source={block.source}
      sourceUrl={block.sourceUrl}
    >
      {block.quote}
    </Blockquote>
  );
};

const TYPE_RENDERERS: Record<string, (block: Block, ctx: RenderContext) => Child> = {
  blockquote: renderQuoteBlock,
  code: renderCodeBlock,
  image: renderImageBlock,
  quote: renderQuoteBlock,
  video: renderVideoBlock,
};

const renderBlockNode = (
  block: Block,
  blockItems: Child[],
  ctx: RenderContext,
): { blockItems: Child[]; node: Child } => {
  if (isString(block.listItem)) {
    const updated = [...blockItems, <li>{ctx.renderChildren(block.children)}</li>];
    return { blockItems: updated, node: null };
  }

  if (0 < blockItems.length) {
    const copy = [...blockItems];
    return { blockItems: [], node: <List>{copy}</List> };
  }

  const styleRenderer = STYLE_RENDERERS[block.style ?? ""];
  return {
    blockItems,
    node: styleRenderer ? styleRenderer(block, ctx) : null,
  };
};

export const PortableText = async ({ children }: PortableTextProperties) => {
  const renderChildren = (nodeChildren: BlockChildren | undefined) => {
    if (isNil(nodeChildren)) {
      return null;
    }

    return map(nodeChildren, async (child) => {
      let content = child.text;

      if (0 < child.marks.length) {
        for (const mark of child.marks) {
          const markDefinition = find(
            flatMap(children, (block) => {
              return block.markDefs ?? [];
            }),
            (definition) => {
              return definition._key === mark;
            },
          );

          if ("code" === mark) {
            return <InlineCode>{content}</InlineCode>;
          }

          if ("link" === markDefinition?._type) {
            // @ts-expect-error allow elements
            content = <Link href={markDefinition.href}>{content}</Link>;
          }
        }
      }

      return content;
    });
  };

  const ctx: RenderContext = { allChildren: children, renderChildren };
  let blockItems: Child[] = [];
  const nodes: Child[] = [];

  for (const block of children) {
    if ("block" === block._type) {
      const result = renderBlockNode(block, blockItems, ctx);
      blockItems = result.blockItems;
      if (!isNil(result.node)) nodes.push(await Promise.resolve(result.node));
    } else {
      const typeRenderer = TYPE_RENDERERS[block._type];
      const node = typeRenderer ? await Promise.resolve(typeRenderer(block, ctx)) : null;
      if (!isNil(node)) nodes.push(node);
    }
  }

  if (0 < blockItems.length) {
    nodes.push(<List>{blockItems}</List>);
  }

  return <>{filter(nodes, (value) => !isNil(value))}</>;
};
```

- [ ] **Step 3: Run tests to confirm behavior preserved**

```powershell
pnpm --filter ethang-hono exec npx vitest run src/components/portable-text.test.tsx
```

Expected: all 20 tests passing.

- [ ] **Step 4: Verify lint — including that the cognitive-complexity suppress comment is gone**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity\apps\ethang-hono
npx eslint src/components/portable-text.tsx
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
git add apps/ethang-hono/src/components/portable-text.tsx
git commit -m "refactor(ethang-hono): replace portable-text map callback with block-type dispatch map"
```

---

## Task 6: `cosmos.ts` — DDD Private Method Extraction

**Files:**
- Modify: `packages/toolbelt/src/events/cosmos.ts`
- Create: `packages/toolbelt/src/events/cosmos.test.ts`

The `Cosmos` class patches `EventTarget.prototype` in its constructor and requires DOM globals. Use `@vitest-environment happy-dom` in the test file.

- [ ] **Step 1: Write tests for each filter priority path**

Create `packages/toolbelt/src/events/cosmos.test.ts`:

```ts
// @vitest-environment happy-dom

import { beforeAll, describe, expect, it, vi } from "vitest";

import { Cosmos } from "./cosmos.ts";

describe(Cosmos, () => {
  let cosmos: Cosmos;
  let targetA: EventTarget;
  let targetB: EventTarget;

  beforeAll(() => {
    cosmos = new Cosmos();
    targetA = document.createElement("div");
    targetB = document.createElement("div");
  });

  describe("getEventListeners with filters", () => {
    it("returns all listeners when no filters provided", () => {
      const listener = vi.fn();
      cosmos.addEventListener(targetA, "click", listener);
      const results = cosmos.getEventListeners();

      expect(results.length).toBeGreaterThan(0);
    });

    it("priority 1 — matches by id", () => {
      const listener = vi.fn();
      const id = cosmos.addEventListener(targetA, "click", listener);
      const results = cosmos.getEventListeners({ id });

      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe(id);
    });

    it("priority 2 — matches by listener + eventName without options", () => {
      const listener = vi.fn();
      cosmos.addEventListener(targetA, "focus", listener);
      const results = cosmos.getEventListeners({
        eventName: "focus",
        listener,
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every((r) => r.listener === listener)).toBe(true);
    });

    it("priority 3 — matches by listener + eventName + options", () => {
      const listener = vi.fn();
      const options = { capture: true };
      cosmos.addEventListener(targetA, "blur", listener, options);
      const results = cosmos.getEventListeners({
        eventName: "blur",
        listener,
        options,
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("priority 4 — matches by eventName + target", () => {
      const listener = vi.fn();
      cosmos.addEventListener(targetB, "keydown", listener);
      const results = cosmos.getEventListeners({
        eventName: "keydown",
        eventTarget: targetB,
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every((r) => r.eventTarget === targetB)).toBe(true);
    });

    it("priority 5 — matches by eventName alone", () => {
      const listener = vi.fn();
      cosmos.addEventListener(targetA, "mouseenter", listener);
      const results = cosmos.getEventListeners({ eventName: "mouseenter" });

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("priority 5 — matches by target alone", () => {
      const dedicated = document.createElement("span");
      const listener = vi.fn();
      cosmos.addEventListener(dedicated, "click", listener);
      const results = cosmos.getEventListeners({ eventTarget: dedicated });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every((r) => r.eventTarget === dedicated)).toBe(true);
    });

    it("priority 6 — empty filters return all listeners", () => {
      const all = cosmos.getEventListeners({});

      expect(all.length).toBe(cosmos.eventListenersSize);
    });
  });

  describe("removeEventListeners", () => {
    it("removes a listener by id", () => {
      const listener = vi.fn();
      const id = cosmos.addEventListener(targetA, "click", listener);
      const sizeBefore = cosmos.eventListenersSize;
      cosmos.removeEventListeners({ id });

      expect(cosmos.eventListenersSize).toBe(sizeBefore - 1);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail or pass with current code**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
pnpm --filter @ethang/toolbelt exec npx vitest run src/events/cosmos.test.ts
```

If tests fail due to missing `happy-dom` dependency, install it:

```powershell
pnpm --filter @ethang/toolbelt add -D @vitest/coverage-v8 happy-dom
```

Then re-run. Record which tests pass. These establish the baseline behavior.

- [ ] **Step 3: Extract private predicate methods in `cosmos.ts`**

Replace the existing `onEventListenerFilter` method (and the comment block above it) with the following. All other methods and the constructor remain unchanged:

```ts
  private matchesById(
    id: string,
    filters: EventListenerFilters<string>,
  ): boolean {
    return !isNil(filters.id) && id === filters.id;
  }

  private matchesByListenerAndEvent(
    listener: StoredListener<string>,
    filters: EventListenerFilters<string>,
  ): boolean {
    const isOptionsEmpty = isNil(filters.options) || isEmpty(filters.options);
    const isEventNameEqual =
      !isNil(filters.eventName) && filters.eventName === listener.eventName;
    const isListenerEqual =
      !isNil(filters.listener) && filters.listener === listener.listener;

    return isEventNameEqual && isListenerEqual && isOptionsEmpty;
  }

  private matchesByListenerAndEventAndOptions(
    listener: StoredListener<string>,
    filters: EventListenerFilters<string>,
  ): boolean {
    const isEventNameEqual =
      !isNil(filters.eventName) && filters.eventName === listener.eventName;
    const isListenerEqual =
      !isNil(filters.listener) && filters.listener === listener.listener;
    const isOptionsEqual =
      !isNil(filters.options) && filters.options === listener.options;

    return isEventNameEqual && isListenerEqual && isOptionsEqual;
  }

  private matchesByEventAndTarget(
    listener: StoredListener<string>,
    filters: EventListenerFilters<string>,
  ): boolean {
    const isEventNameEqual =
      !isNil(filters.eventName) && filters.eventName === listener.eventName;
    const isTargetEqual =
      !isNil(filters.eventTarget) &&
      listener.eventTarget === filters.eventTarget;

    return isEventNameEqual && isTargetEqual;
  }

  private matchesByAny(
    listener: StoredListener<string>,
    filters: EventListenerFilters<string>,
  ): boolean {
    const isEventNameEqual =
      !isNil(filters.eventName) && filters.eventName === listener.eventName;
    const isListenerEqual =
      !isNil(filters.listener) && filters.listener === listener.listener;
    const isOptionsEqual =
      !isNil(filters.options) && filters.options === listener.options;
    const isTargetEqual =
      !isNil(filters.eventTarget) &&
      listener.eventTarget === filters.eventTarget;

    return isEventNameEqual || isTargetEqual || isListenerEqual || isOptionsEqual;
  }

  /*
   * Uses priority filtering.
   * 1st priority: If Id is defined in filters, callback will run based on id.
   * 2nd priority: Listener + EventName (no options)
   * 3rd priority: Listener + EventName + Options
   * 4th: EventName + Target
   * 5th: EventName OR Target OR Listener OR Options
   * 6th: Empty filters — match all
   */
  private onEventListenerFilter<T extends keyof WindowEventMapPlus>(
    filters: EventListenerFilters<T>,
    callback: (id: string, listener: StoredListener<string>) => void,
  ) {
    for (const [id, listener] of this._nativeListeners) {
      if (this.matchesById(id, filters)) {
        callback(id, listener);
      } else if (this.matchesByListenerAndEvent(listener, filters)) {
        callback(id, listener);
      } else if (this.matchesByListenerAndEventAndOptions(listener, filters)) {
        callback(id, listener);
      } else if (this.matchesByEventAndTarget(listener, filters)) {
        callback(id, listener);
      } else if (this.matchesByAny(listener, filters)) {
        callback(id, listener);
      } else if (isEmpty(filters)) {
        callback(id, listener);
      }
    }
  }
```

Also remove the `// eslint-disable-next-line sonar/cognitive-complexity` comment on the line before the old `onEventListenerFilter`.

- [ ] **Step 4: Run tests to confirm behavior preserved**

```powershell
pnpm --filter @ethang/toolbelt exec npx vitest run src/events/cosmos.test.ts
```

Expected: same tests passing as in Step 2, plus any new tests now passing.

- [ ] **Step 5: Verify lint — cognitive-complexity suppress comment must be gone**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity\packages\toolbelt
npx eslint src/events/cosmos.ts
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
git add packages/toolbelt/src/events/cosmos.ts packages/toolbelt/src/events/cosmos.test.ts
git commit -m "refactor(toolbelt): extract cosmos filter predicates to private methods (DDD)"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Grep for any remaining cognitive-complexity suppressions**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
Select-String -Path "apps\**\*.ts", "apps\**\*.tsx", "packages\**\*.ts", "packages\**\*.tsx" -Pattern "sonar/cognitive-complexity" -Recurse
```

Expected: **no matches**. If any remain, fix the underlying complexity and remove the comment before proceeding.

- [ ] **Step 2: Run lint across all modified packages**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity\apps\ethang-hono
npx eslint src/ 2>&1 | Select-String -Pattern "cyclomatic|cognitive"
```

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity\apps\sterett-hono
npx eslint src/ 2>&1 | Select-String -Pattern "cyclomatic|cognitive"
```

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity\packages\toolbelt
npx eslint src/ 2>&1 | Select-String -Pattern "cyclomatic|cognitive"
```

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity\packages\leetcode
npx eslint src/ 2>&1 | Select-String -Pattern "cyclomatic|cognitive"
```

Expected: **no output** from any of the above (zero cyclomatic or cognitive violations).

- [ ] **Step 3: Run all test suites across modified packages**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
pnpm --filter ethang-hono exec npx vitest run
pnpm --filter sterett-hono exec npx vitest run
pnpm --filter @ethang/toolbelt exec npx vitest run
pnpm --filter leetcode exec npx vitest run
```

Expected: all suites green.

- [ ] **Step 4: Final commit if any cleanup was needed**

If Step 1 revealed additional suppressions that were fixed, commit those fixes:

```powershell
git add -A
git commit -m "fix: remove remaining sonar/cognitive-complexity suppressions"
```

Otherwise skip this step.

- [ ] **Step 5: Mark the worktree branch ready for PR**

```powershell
Set-Location C:\Users\glove\projects\ethang-monorepo-complexity
git log --oneline -10
```

Review commits. Then push:

```powershell
git push origin master
```
