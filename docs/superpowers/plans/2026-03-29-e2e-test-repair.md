# E2E Test Repair — Post Midnight Space Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring all ethang-hono e2e tests (mouse, keyboard, screen-reader) to a fully green state after the midnight space redesign, fixing both incorrect tests and incorrect app behavior.

**Architecture:** Four phases — mouse (Chromium), keyboard (Chromium), screen-reader (NVDA/Chromium), full browser matrix. Each phase runs tests, triages every failure against both the test and the component, fixes appropriately, then re-runs until green. Commits after each phase is clean.

**Tech Stack:** Playwright, @axe-core/playwright, @guidepup/playwright (NVDA), Hono JSX, Tailwind CSS, midnight space design tokens.

---

## Triage Decision for Every Failure

Before fixing anything, answer two questions:
1. **Is the test correct?** Does it describe real, desirable behavior using the right selector/aria query?
2. **Is the app correct?** Does the component implement that behavior?

| Test correct? | App correct? | Action |
|---|---|---|
| Yes | No | Fix the component |
| No | Yes | Fix the test |
| No | No | Fix both |
| Yes | Yes | Investigate — flake or environment issue |

**Never skip or `.skip()` a test to make a suite green.**

---

## File Map

These are the files most likely to be modified. Exact set depends on what failures appear.

### E2E test files (fix incorrect assertions/selectors)
- `apps/ethang-hono/e2e/mouse/*.spec.ts`
- `apps/ethang-hono/e2e/keyboard/*.spec.ts`
- `apps/ethang-hono/e2e/screen-reader/*.spec.ts`
- `apps/ethang-hono/e2e/broken-links.spec.ts`
- `apps/ethang-hono/e2e/fixtures/axe-fixture.ts`
- `apps/ethang-hono/e2e/helpers/courses-auth-helpers.ts`
- `apps/ethang-hono/e2e/helpers/screen-reader-helpers.ts`

### Component files (fix semantic HTML, aria attributes, CSS classes)
- `apps/ethang-hono/src/components/navigation/navigation.tsx`
- `apps/ethang-hono/src/components/navigation/navigation-button.tsx`
- `apps/ethang-hono/src/components/navigation/navigation-link.tsx`
- `apps/ethang-hono/src/components/navigation/navigation.client.ts`
- `apps/ethang-hono/src/components/courses/course-completion.client.ts`
- `apps/ethang-hono/src/components/courses/course-item.tsx`
- `apps/ethang-hono/src/components/courses/course-list.tsx`
- `apps/ethang-hono/src/components/courses/course-progress-bar.tsx`
- `apps/ethang-hono/src/components/courses/courses-container.tsx`
- `apps/ethang-hono/src/components/button/button.tsx`
- `apps/ethang-hono/src/components/pages/*.tsx`
- `apps/ethang-hono/src/components/layouts/*.tsx`

---

## Task 1: Run mouse tests on Chromium

**Files:** None modified — this is a run-only step.

- [ ] **Step 1: Run the mouse-chromium project**

```bash
cd apps/ethang-hono && pnpm exec playwright test --project=mouse-chromium
```

Expected: some tests pass, some fail. Note the total failure count.

- [ ] **Step 2: Open the HTML report to see full failure details**

```bash
cd apps/ethang-hono && pnpm exec playwright show-report
```

Review each failure. For each one, note:
- Which spec file and test name
- The assertion that failed (e.g., element not found, wrong class, axe violations)
- The selector used in the test

---

## Task 2: Fix mouse test failures (repeat until `mouse-chromium` is green)

**Files:** Varies per failure — see patterns below.

Run this task as a loop: fix one failure, re-run, repeat.

- [ ] **Step 1: For each axe violation failure — fix the component**

Axe violations are always component fixes, never test fixes. The axe fixture runs automatically after every `axePage` test. Common violation patterns and fixes:

**Missing button label:**
```tsx
// Bad — no accessible name
<button class="course-completion-button" ...>

// Good — add aria-label
<button class="course-completion-button" aria-label="Mark course as complete" ...>
```

**Missing landmark:**
```tsx
// Bad — div wrapping main content
<div class="...">

// Good — use semantic element
<main class="...">
```

**Insufficient color contrast:**
Fix by adjusting the midnight space token value in `apps/ethang-hono/src/index.css`, not by suppressing the violation.

- [ ] **Step 2: For each "element not visible" / "element not found" failure — triage selector vs component**

Read the test assertion and the current component markup side by side.

If the test uses a role + name selector (preferred), check the component's semantic HTML:
```tsx
// Test expects:
page.getByRole("heading", { name: "Recommended Courses" })

// Check the component has:
<h1>Recommended Courses</h1>  // or h2, h3 etc.
```

If the heading text changed in the redesign, update the test to match the new correct text. If the heading is missing, add it to the component.

If the test uses an ID selector (e.g., `#sign-in-prompt`, `#auth-section-header`, `#course-progress-bar`), verify the ID exists on the rendered element. If the redesign removed or renamed the ID, add it back — IDs used in tests are part of the component's interface.

- [ ] **Step 3: For CSS class assertion failures on completion buttons**

The mouse/courses-auth.spec.ts and keyboard/courses.spec.ts tests assert `bg-brand` and `bg-warning` classes. The component currently uses `bg-sky-300/10` and `bg-amber-400/10`. The tests reflect the intended midnight space token naming.

Fix `apps/ethang-hono/src/components/courses/course-completion.client.ts` — replace raw Tailwind colors with token classes:

```typescript
// Before
button.classList.add("bg-sky-300/10");
button.classList.remove("bg-slate-700", "bg-amber-400/10");
// ...
button.classList.add("bg-amber-400/10");
button.classList.remove("bg-slate-700", "bg-sky-300/10");

// After — use midnight space token classes
button.classList.add("bg-brand");
button.classList.remove("bg-default", "bg-warning");
// ...
button.classList.add("bg-warning");
button.classList.remove("bg-default", "bg-brand");
```

Verify the token classes (`bg-brand`, `bg-warning`, `bg-default`) are defined in `apps/ethang-hono/src/index.css` under the midnight space `@theme` block. Add them if missing.

- [ ] **Step 4: Re-run mouse-chromium after each batch of fixes**

```bash
cd apps/ethang-hono && pnpm exec playwright test --project=mouse-chromium
```

Continue fixing until output shows:

```
✓  N passed
```

- [ ] **Step 5: Commit**

```bash
cd apps/ethang-hono && git add -p
git commit -m "fix(ethang-hono): repair e2e mouse tests after midnight space redesign"
```

---

## Task 3: Run keyboard tests on Chromium

**Files:** None modified — run-only step.

- [ ] **Step 1: Run the keyboard-chromium project**

```bash
cd apps/ethang-hono && pnpm exec playwright test --project=keyboard-chromium
```

Note all failures.

- [ ] **Step 2: Open the report**

```bash
cd apps/ethang-hono && pnpm exec playwright show-report
```

---

## Task 4: Fix keyboard test failures (repeat until `keyboard-chromium` is green)

**Files:** Varies — see patterns below.

- [ ] **Step 1: For "element not focused" failures — verify focusability**

Keyboard tests call `.focus()` then assert `toBeFocused()`. If this fails, the element is either not natively focusable or has `tabindex="-1"`.

```tsx
// Bad — div is not focusable
<div class="course-completion-button" ...>

// Good — use button
<button class="course-completion-button" ...>
```

- [ ] **Step 2: For `aria-expanded` attribute failures — check NavigationButton**

The keyboard/navigation.spec.ts tests assert `aria-expanded` toggles between `"true"` and `"false"` when the hamburger is activated. The NavigationButton renders `aria-expanded="false"` statically.

The toggle logic lives in `apps/ethang-hono/src/components/navigation/navigation.client.ts`. Verify it sets `aria-expanded` on click:

```typescript
// Expected client-side behavior in navigation.client.ts
button.addEventListener("click", () => {
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  navMenu.classList.toggle("hidden");
});
```

If the client script doesn't do this, add it. If the script was renamed or restructured during the redesign, read `navigation.client.ts` and align the logic.

- [ ] **Step 3: For `#navbar-default` visibility failures — check nav menu ID**

The keyboard/navigation.spec.ts tests use `page.locator("#navbar-default")`. Verify `navigation.tsx` still renders `<div id="navbar-default" ...>`. If the redesign changed this ID, restore it.

- [ ] **Step 4: For Enter/Space key interaction failures on completion buttons**

The keyboard/courses.spec.ts tests press `Enter` and `Space` on `.course-completion-button` and assert the class changes. Since the button is a `<button>`, Enter/Space should trigger `click` natively. If the class isn't changing, the click handler in `course-completion.client.ts` may not be firing.

Verify the client script attaches listeners to the button selector:

```typescript
const buttons = document.querySelectorAll<HTMLButtonElement>(BUTTON_SELECTOR);
for (const button of buttons) {
  button.addEventListener("click", handleButtonClick);
}
```

If the selector changed (e.g., `.course-completion-button` was renamed), update either the selector constant in the client script or the class on the JSX element — keep them in sync.

- [ ] **Step 5: Re-run keyboard-chromium after each batch of fixes**

```bash
cd apps/ethang-hono && pnpm exec playwright test --project=keyboard-chromium
```

Continue until:

```
✓  N passed
```

- [ ] **Step 6: Commit**

```bash
cd apps/ethang-hono && git add -p
git commit -m "fix(ethang-hono): repair e2e keyboard tests after midnight space redesign"
```

---

## Task 5: Run screen-reader tests (NVDA)

**Files:** None modified — run-only step.

**Prerequisite:** NVDA must be running on the machine. The screen-reader suite uses `headless: false` and requires a real NVDA process.

- [ ] **Step 1: Run the screen-reader suite**

```bash
cd apps/ethang-hono && pnpm test:e2e:sr
```

Each test has a 5-minute timeout and retries up to 2 times. A failure that appears only once may be a flake — wait for the retry result before treating it as real.

- [ ] **Step 2: Open the report**

```bash
cd apps/ethang-hono && pnpm exec playwright show-report --config=playwright.screen-reader.config.ts
```

---

## Task 6: Fix screen-reader failures (repeat until screen-reader suite is green)

**Files:** Varies — component fixes for semantic structure issues, test fixes for wrong expected phrases.

Screen-reader fixes have two distinct concerns:

**A — Correctness:** Does NVDA announce the right content at all?
**B — Quality:** Is the announced text comfortable — no redundancy, no verbosity?

- [ ] **Step 1: For "heading not found" / wrong phrase failures — check semantic HTML**

If `nvda.lastSpokenPhrase()` doesn't contain the expected text, the heading may be missing or may be a different element level. NVDA announces headings differently by level.

```tsx
// If test expects "heading" in the phrase, ensure the element is h1/h2/h3 etc.
// A <div class="text-2xl"> will not be announced as a heading
<h1>Recommended Courses</h1>
```

Check `apps/ethang-hono/src/components/pages/` and the relevant route handler for each page.

- [ ] **Step 2: For redundant announcement quality failures**

NVDA reads `aria-label` + visible text if both are present, causing repetition. Example of what to avoid:

```tsx
// Bad — NVDA reads "Home link Home"
<a href="/" aria-label="Home">Home</a>

// Good — aria-label only when it adds meaning beyond visible text
<a href="/">Home</a>

// Good — aria-label replaces visible text when icon-only
<button aria-label="Open main menu">
  <svg aria-hidden="true">...</svg>
</button>
```

For each page, walk through the tab order mentally: what would NVDA say for each focusable element? Remove `aria-label` where it duplicates visible text. Add it where visible text is absent or ambiguous.

- [ ] **Step 3: For "link not found" failures in navigation announcements**

The home/screen-reader spec tabs through 10 elements and checks that at least one includes "link". If navigation links don't get focus or aren't announced as links, check:

```tsx
// NavigationLink must render an <a> element, not a <button> or <div>
// Check apps/ethang-hono/src/components/navigation/navigation-link.tsx
```

- [ ] **Step 4: For sign-in error announcement failures**

The sign-in/screen-reader spec fills the form, submits, waits for `#sign-in-error` to be visible, then navigates with NVDA to find "Failed to sign in". If NVDA doesn't announce it, the error element may lack `role="alert"` or `aria-live="assertive"`:

```tsx
// apps/ethang-hono/src/components/pages/sign-in.tsx or sign-in route
<div id="sign-in-error" role="alert" aria-live="assertive" class="hidden">
  Failed to sign in
</div>
```

- [ ] **Step 5: For consistent flakes (fail 3/3 times) — check NVDA timing**

If a test consistently fails on the phrase assertion, the issue may be NVDA hasn't finished speaking before `lastSpokenPhrase()` is called. The suite already has `retries: 2`. If it still fails consistently, add an `nvda.waitForSpoken()` or an extra `nvda.next()` call before the assertion — but only if the timing fix doesn't change what's being tested.

- [ ] **Step 6: Re-run screen-reader suite after each batch of fixes**

```bash
cd apps/ethang-hono && pnpm test:e2e:sr
```

Continue until all tests pass (accounting for retries — if a test passes on retry 2, it's still passing).

- [ ] **Step 7: Commit**

```bash
cd apps/ethang-hono && git add -p
git commit -m "fix(ethang-hono): repair e2e screen-reader tests and improve NVDA announcement quality"
```

---

## Task 7: Run full browser matrix

**Files:** None modified — run-only step.

All three categories are green on Chromium. Now run the complete suite across all 5 browser/device combinations plus broken-links.

- [ ] **Step 1: Run the full suite**

```bash
cd apps/ethang-hono && pnpm test:e2e
```

This runs: `mouse-chromium`, `mouse-firefox`, `mouse-webkit`, `mouse-Mobile Chrome`, `mouse-Mobile Safari`, `keyboard-chromium`, `keyboard-firefox`, `keyboard-webkit`, `keyboard-Mobile Chrome`, `keyboard-Mobile Safari`, `broken-links`.

- [ ] **Step 2: Open the report**

```bash
cd apps/ethang-hono && pnpm exec playwright show-report
```

At this stage, failures should be browser-specific quirks — not logic errors (those were fixed in Tasks 2 and 4).

---

## Task 8: Fix browser-specific failures

**Files:** Varies — typically component CSS or interaction behavior differences.

- [ ] **Step 1: For WebKit (Safari) failures — check CSS and focus behavior**

WebKit handles `outline`, `focus-visible`, and `scroll` CSS differently. If a keyboard focus test fails only on WebKit, check whether the element has a visible focus indicator using `:focus-visible`:

```css
/* Good — cross-browser focus indicator */
.course-completion-button:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}
```

If a click interaction fails on WebKit, check whether the element is a `<button>` (natively clickable) vs a styled `<div>`.

- [ ] **Step 2: For mobile (Pixel 7 / iPhone 15) failures — check hamburger menu**

Mobile tests include hamburger menu tests (skipped on desktop). If the hamburger test fails on mobile, the issue is usually:
- The `md:hidden` class isn't hiding the button on desktop correctly (Tailwind prefix)
- The nav toggle client script isn't initializing on mobile
- The `#navbar-default` starts visible instead of hidden on mobile

Check `navigation.tsx` — on mobile the nav menu must start with class `hidden`.

- [ ] **Step 3: For broken-links failures — check route definitions**

The broken-links spec crawls all internal links. If it reports a broken link:

1. Check `apps/ethang-hono/routes.ts` — is the route definition still correct?
2. Check the Hono route handlers — is the route still registered?
3. If a page was removed during the redesign and links still point to it, either restore the page or remove the links.

- [ ] **Step 4: Re-run the full suite**

```bash
cd apps/ethang-hono && pnpm test:e2e
```

Continue fixing until:

```
✓  N passed
```

- [ ] **Step 5: Commit**

```bash
cd apps/ethang-hono && git add -p
git commit -m "fix(ethang-hono): repair cross-browser e2e failures after midnight space redesign"
```

---

## Task 9: Final clean run

**Files:** None modified.

- [ ] **Step 1: Run the complete suite one final time**

```bash
cd apps/ethang-hono && pnpm test:e2e && pnpm test:e2e:sr
```

Both commands must exit with zero failures. No skipped tests.

- [ ] **Step 2: Confirm success criteria are met**

- [ ] All mouse tests pass on all 5 browser/device combinations
- [ ] All keyboard tests pass on all 5 browser/device combinations
- [ ] Broken-links suite passes
- [ ] All screen-reader tests pass on Desktop Chrome with NVDA
- [ ] No tests use `.skip()` to hide failures
- [ ] No axe violations remain
- [ ] Screen-reader output is concise — no redundant announcements verified during Task 6
