# Midnight Space Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all broken Flowbite-era design tokens with a new token-first design system using Tailwind v4 `@theme` overrides, delivering a midnight/space depth aesthetic.

**Architecture:** Override the `slate` and `sky` palettes in `@theme` with custom dark blue-black values. All interactive elements use the tinted-border pattern (translucent bg + semi-transparent border). Background is a CSS radial gradient on `html` with `background-attachment: fixed`.

**Tech Stack:** Tailwind CSS v4 (`@theme` CSS-first config), Space Grotesk + Inter (Google Fonts), Hono SSR, Vitest, Playwright

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/index.css` | Modify | `@theme` overrides, font import, radial void background |
| `src/components/layouts/main-layout.tsx` | Modify | Remove `dark` and `bg-dark` from `html` class |
| `src/components/navigation/navigation.test.tsx` | Modify (test first) | Update active nav assertion |
| `src/components/navigation/navigation.tsx` | Modify | Container classes — broken tokens |
| `src/components/navigation/navigation-link.tsx` | Modify | Active/inactive link classes |
| `src/components/navigation/navigation-button.tsx` | Modify | Button classes in nav |
| `src/components/button/button-classes.test.ts` | Modify (test first) | Update all broken class assertions |
| `src/components/button/button-classes.ts` | Modify | All 8 variants — tinted-border pattern |
| `src/components/typography/h1.tsx` | Modify | `text-heading` → `text-slate-100 font-heading` |
| `src/components/typography/h2.tsx` | Modify | `text-heading` → `text-slate-100 font-heading` |
| `src/components/typography/h3.tsx` | Modify | `text-heading` → `text-slate-100 font-heading` |
| `src/components/typography/p.tsx` | Modify | `text-body` → `text-slate-200` |
| `src/components/typography/link.tsx` | Modify | `text-fg-brand` → `text-sky-300` |
| `src/components/typography/blockquote.tsx` | Modify | All broken tokens → new palette |
| `src/components/typography/inline-code.tsx` | Modify | `bg-muted` → `bg-slate-700 text-sky-300` |
| `src/components/typography/hr.tsx` | Modify | `bg-neutral-quaternary` → `bg-slate-600` |
| `src/components/typography/list.tsx` | Modify | `text-body` → `text-slate-200` |
| `src/components/cards/profile-card.tsx` | Modify | All broken tokens |
| `src/components/courses/courses-components.test.tsx` | Modify (test first) | Update broken class assertions |
| `src/components/courses/course-progress-bar.tsx` | Modify | Track/fill colors |
| `src/components/courses/course-list.tsx` | Modify | Status badge classes |
| `src/components/courses/courses-container.tsx` | Modify | Text color tokens |
| `src/components/routes/sign-in.tsx` | Modify | All inline broken tokens |
| `src/components/routes/blog.tsx` | Modify | `text-fg-brand`, `text-fg-purple` tokens |

---

## Task 1: CSS Foundation

**Files:**
- Modify: `apps/ethang-hono/src/index.css`

`★ Insight ─────────────────────────────────────`
Tailwind v4 uses CSS-native `@theme` blocks instead of `tailwind.config.js`. Overriding `--color-slate-300` replaces Tailwind's built-in value globally — every `text-slate-300`, `bg-slate-300`, etc. class across the entire app now uses your custom hex value. This is how you get a unified design system without custom token names.

In raw CSS (not Tailwind utilities), reference these as `var(--color-slate-950)` — NOT `theme(colors.slate.950)` which is Tailwind v3 syntax.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Read the current file**

Run: `mcp__webstorm__read_file` on `apps/ethang-hono/src/index.css`

- [ ] **Step 2: Replace the Google Fonts import**

In `apps/ethang-hono/src/index.css`, replace the existing `@import url(...)` Google Fonts line with:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:ital,wght@0,300;0,400;0,500;1,300&display=swap');
```

- [ ] **Step 3: Add the `@theme` block**

After the `@import "tailwindcss";` line, add:

```css
@theme {
  /* Typography */
  --font-heading: 'Space Grotesk', system-ui, sans-serif;
  --font-sans:    'Inter', system-ui, sans-serif;

  /* Slate — depth stack */
  --color-slate-950: #010102;
  --color-slate-900: #080b12;
  --color-slate-800: #0c1220;
  --color-slate-700: #111929;
  --color-slate-600: #1c2438;
  --color-slate-500: #2a3650;
  --color-slate-400: #3a4a68;
  --color-slate-300: #5e7394;
  --color-slate-200: #9aadc8;
  --color-slate-100: #dde3f0;

  /* Sky — accent */
  --color-sky-300: #7dd3fc;
  --color-sky-900: #0d2a3f;

  /* Radius */
  --radius-base: 0.5rem;
  --radius-sm:   0.25rem;
}
```

- [ ] **Step 4: Add the radial void background and remove old dark tokens**

Replace the entire `@custom-variant dark` block and `.dark {}` block with:

```css
@layer base {
  html {
    background:
      radial-gradient(ellipse 100% 100% at 50% 50%,
        var(--color-slate-950) 0%,
        #060a14 40%,
        #080c18 65%,
        #04060e 85%,
        var(--color-slate-950) 100%
      );
    background-attachment: fixed;
    min-height: 100vh;
  }
}
```

Keep the `pre > code:not(.hljs)`, `.hljs-comment`, and `code.hljs` rules — they are still needed.

- [ ] **Step 5: Verify the file looks correct**

The final `src/index.css` should have this structure (in order):
1. Google Fonts `@import url(...)`
2. `@import "tailwindcss";`
3. `@theme { ... }` block with all overrides
4. `@layer base { html { background: ...; } }`
5. `pre > code:not(.hljs) { ... }` and hljs rules

- [ ] **Step 6: Commit**

```bash
git add apps/ethang-hono/src/index.css
git commit -m "feat(ethang-hono): add midnight space @theme overrides and void background"
```

---

## Task 2: Main Layout

**Files:**
- Modify: `apps/ethang-hono/src/components/layouts/main-layout.tsx`

- [ ] **Step 1: Read the file**

Run: `mcp__webstorm__read_file` on `apps/ethang-hono/src/components/layouts/main-layout.tsx`

- [ ] **Step 2: Remove `dark` and `bg-dark` from the `html` element**

The `html` element will have a class like `"dark bg-dark scroll-smooth"`. Change it to:

```tsx
<html lang="en-US" class="scroll-smooth">
```

The background is now handled by the `@layer base` CSS rule added in Task 1. The `dark` variant class is no longer needed — there is no light mode.

- [ ] **Step 3: Update `body` background if present**

If `body` has `bg-dark` or similar token, change it to `bg-slate-900` (the "body" depth level in the stack).

- [ ] **Step 4: Commit**

```bash
git add apps/ethang-hono/src/components/layouts/main-layout.tsx
git commit -m "feat(ethang-hono): remove dark mode variant and broken bg-dark from layout"
```

---

## Task 3: Navigation

**Files:**
- Modify (test first): `apps/ethang-hono/src/components/navigation/navigation.test.tsx`
- Modify: `apps/ethang-hono/src/components/navigation/navigation.tsx`
- Modify: `apps/ethang-hono/src/components/navigation/navigation-link.tsx`
- Modify: `apps/ethang-hono/src/components/navigation/navigation-button.tsx`

`★ Insight ─────────────────────────────────────`
TDD for styling: write the test asserting the *new* class name before changing the component. This makes the test fail on the old broken token, proving the test is actually checking what you think it is, then your component change makes it pass. Classic red-green cycle applied to CSS class verification.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Read navigation test and components**

Read all four files:
- `apps/ethang-hono/src/components/navigation/navigation.test.tsx`
- `apps/ethang-hono/src/components/navigation/navigation.tsx`
- `apps/ethang-hono/src/components/navigation/navigation-link.tsx`
- `apps/ethang-hono/src/components/navigation/navigation-button.tsx`

- [ ] **Step 2: Update the test — active nav link assertion**

In `navigation.test.tsx`, find the test that checks for the active nav link class (currently checking `"bg-brand"`). Update it to check for `"bg-sky-300/10"`:

```typescript
// Before:
expect(activeLink).toHaveClass('bg-brand');

// After:
expect(activeLink).toHaveClass('bg-sky-300/10');
```

Also update any other broken token assertions in this test file using the token map from the spec.

- [ ] **Step 3: Run the test to verify it fails**

Run: `vitest run apps/ethang-hono/src/components/navigation/navigation.test.tsx`

Expected: FAIL — `bg-sky-300/10` class not found (component still uses `bg-brand`)

- [ ] **Step 4: Update `navigation.tsx` container classes**

Replace broken tokens in the nav container:

| Old | New |
|---|---|
| `bg-neutral-primary` | `bg-slate-800` |
| `border-default` | `border-slate-600` |
| `rounded-base` | `rounded-lg` |
| `bg-neutral-secondary-soft` | `bg-slate-700` |

The nav container should look like:

```tsx
<nav class="bg-slate-800 border-b border-slate-600 shadow-[0_4px_20px_rgba(0,0,0,0.4)] fixed top-0 w-full z-20">
```

- [ ] **Step 5: Update `navigation-link.tsx`**

Active link classes:
```tsx
// Active state:
'bg-sky-300/10 border border-sky-300/30 text-sky-300'

// Inactive state:
'text-slate-200 hover:bg-slate-700 hover:text-slate-100'
```

Replace:
| Old | New |
|---|---|
| `bg-brand` | `bg-sky-300/10` |
| `border-brand` or similar | `border-sky-300/30` |
| `text-fg-brand` or `text-brand` | `text-sky-300` |
| `text-heading` | `text-slate-200` |
| `hover:bg-neutral-tertiary` | `hover:bg-slate-700` |

- [ ] **Step 6: Update `navigation-button.tsx`**

Replace:
| Old | New |
|---|---|
| `rounded-base` | `rounded-lg` |
| `text-body` | `text-slate-200` |
| `hover:bg-neutral-secondary-soft` | `hover:bg-slate-700` |
| `focus:ring-neutral-tertiary` | `focus:ring-slate-400/30` |

- [ ] **Step 7: Run the test to verify it passes**

Run: `vitest run apps/ethang-hono/src/components/navigation/navigation.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/ethang-hono/src/components/navigation/
git commit -m "feat(ethang-hono): update navigation to midnight space design tokens"
```

---

## Task 4: Button System

**Files:**
- Modify (test first): `apps/ethang-hono/src/components/button/button-classes.test.ts`
- Modify: `apps/ethang-hono/src/components/button/button-classes.ts`

`★ Insight ─────────────────────────────────────`
The tinted-border pattern (`bg-sky-300/10 border border-sky-300/30 text-sky-300`) is a deliberate design choice: buttons *belong* in the depth stack rather than punching through it with solid color fills. This matches how badges, active nav items, and blockquotes all work — the same formula applied consistently across every interactive element.

Tailwind's opacity modifier syntax (`/10`, `/30`) compiles to `color-mix(in srgb, <color> 10%, transparent)` in v4, enabling this pattern with zero custom CSS.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Read both files**

Read:
- `apps/ethang-hono/src/components/button/button-classes.test.ts`
- `apps/ethang-hono/src/components/button/button-classes.ts`

- [ ] **Step 2: Update the test file with all new class assertions**

In `button-classes.test.ts`, update every broken token assertion. Here is the complete mapping:

| Old assertion | New assertion |
|---|---|
| `"rounded-base"` | `"rounded-lg"` |
| `"bg-brand"` (primary bg) | `"bg-sky-300/10"` |
| `"border-brand"` or similar | `"border-sky-300/30"` |
| `"text-fg-brand"` or `"text-white"` (primary text) | `"text-sky-300"` |
| `"bg-neutral-secondary-medium"` (secondary bg) | `"bg-slate-700"` |
| `"border-neutral-secondary"` (secondary border) | `"border-slate-500"` |
| `"text-body"` or `"text-white"` (secondary text) | `"text-slate-200"` |
| `"bg-neutral-primary-soft"` (ghost bg) | `"bg-transparent"` |
| `"text-heading"` (ghost text) | `"text-slate-200"` |
| `"bg-success"` or `"bg-green-*"` | `"bg-green-400/10"` |
| `"border-success"` or similar | `"border-green-400/30"` |
| `"text-white"` (success text) | `"text-green-400"` |
| `"bg-danger"` or `"bg-red-*"` | `"bg-red-400/10"` |
| `"border-danger"` or similar | `"border-red-400/30"` |
| `"text-white"` (danger text) | `"text-red-400"` |
| `"bg-warning"` or `"bg-amber-*"` | `"bg-amber-400/10"` |
| `"border-warning"` or similar | `"border-amber-400/30"` |
| `"text-white"` (warning text) | `"text-amber-400"` |
| `"bg-dark"` (dark variant) | `"bg-slate-900"` |
| `"text-heading"` (dark text) | `"text-slate-100"` |

Also verify the test checks `"font-heading"` is included in base button classes.

- [ ] **Step 3: Run the test to verify it fails**

Run: `vitest run apps/ethang-hono/src/components/button/button-classes.test.ts`

Expected: FAIL — multiple assertions failing on old broken token names

- [ ] **Step 4: Update `button-classes.ts` — all variants**

Replace the entire implementation with the new tinted-border pattern for all variants:

```typescript
const BASE =
  'inline-flex items-center justify-center font-heading font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none';

const VARIANTS = {
  primary:
    'bg-sky-300/10 border-sky-300/30 text-sky-300 hover:bg-sky-300/20 hover:border-sky-300/50 focus:ring-sky-300/30',
  secondary:
    'bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600 hover:border-slate-400 focus:ring-slate-400/30',
  ghost:
    'bg-transparent border-transparent text-slate-200 hover:bg-slate-700 hover:border-slate-500 focus:ring-slate-400/30',
  success:
    'bg-green-400/10 border-green-400/30 text-green-400 hover:bg-green-400/20 hover:border-green-400/50 focus:ring-green-400/30',
  danger:
    'bg-red-400/10 border-red-400/30 text-red-400 hover:bg-red-400/20 hover:border-red-400/50 focus:ring-red-400/30',
  warning:
    'bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400/20 hover:border-amber-400/50 focus:ring-amber-400/30',
  dark:
    'bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800 hover:border-slate-500 focus:ring-slate-400/30',
  link:
    'bg-transparent border-transparent text-sky-300 hover:underline focus:ring-sky-300/30 p-0',
} as const;

const SIZES = {
  xs:   'text-[11px] px-[10px] py-[4px]',
  sm:   'text-[12px] px-[12px] py-[5px]',
  base: 'text-[13px] px-[16px] py-[7px]',
  lg:   'text-[15px] px-[22px] py-[10px]',
} as const;
```

Export a `buttonClasses(variant, size)` function (or equivalent) that combines `BASE + VARIANTS[variant] + SIZES[size]`.

Match whatever the existing export shape is (don't change the function signature, only the internals).

- [ ] **Step 5: Run the test to verify it passes**

Run: `vitest run apps/ethang-hono/src/components/button/button-classes.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/ethang-hono/src/components/button/
git commit -m "feat(ethang-hono): replace button variants with tinted-border pattern"
```

---

## Task 5: Typography

**Files:**
- Modify: `apps/ethang-hono/src/components/typography/h1.tsx`
- Modify: `apps/ethang-hono/src/components/typography/h2.tsx`
- Modify: `apps/ethang-hono/src/components/typography/h3.tsx`
- Modify: `apps/ethang-hono/src/components/typography/p.tsx`
- Modify: `apps/ethang-hono/src/components/typography/link.tsx`
- Modify: `apps/ethang-hono/src/components/typography/blockquote.tsx`
- Modify: `apps/ethang-hono/src/components/typography/inline-code.tsx`
- Modify: `apps/ethang-hono/src/components/typography/hr.tsx`
- Modify: `apps/ethang-hono/src/components/typography/list.tsx`

`★ Insight ─────────────────────────────────────`
`font-heading` is the Tailwind utility generated from `--font-heading` in `@theme`. This is Space Grotesk. It applies to headings and UI chrome (buttons, nav, labels) — anything that needs the geometric precision of the display font. Body copy, captions, and prose use `font-sans` (Inter), which is the default, so no explicit class is needed on `<p>` or `<li>`.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Read all typography files**

Read each file before modifying it.

- [ ] **Step 2: Update `h1.tsx`**

```tsx
// Replace class string — keep any existing size/margin classes, only replace color/font tokens:
// text-heading → text-slate-100 font-heading
// Example result:
<h1 class="font-heading text-[22px] font-bold text-slate-100 leading-tight tracking-tight">
  {children}
</h1>
```

- [ ] **Step 3: Update `h2.tsx`**

```tsx
// text-heading → text-slate-100 font-heading
// border-default → border-slate-600 (if h2 has a bottom border)
<h2 class="font-heading text-[16px] font-semibold text-slate-100 border-b border-slate-600 pb-2">
  {children}
</h2>
```

- [ ] **Step 4: Update `h3.tsx`**

```tsx
// text-heading → text-slate-100 font-heading
<h3 class="font-heading text-[13px] font-semibold text-slate-100">
  {children}
</h3>
```

- [ ] **Step 5: Update `p.tsx`**

```tsx
// text-body → text-slate-200
<p class="text-[14px] text-slate-200 leading-relaxed">
  {children}
</p>
```

- [ ] **Step 6: Update `link.tsx`**

```tsx
// text-fg-brand → text-sky-300
<a class="text-sky-300 font-medium hover:border-b hover:border-sky-300 transition-colors">
  {children}
</a>
```

- [ ] **Step 7: Update `blockquote.tsx`**

```tsx
// border-default → border-sky-300
// bg-neutral-secondary-soft → bg-sky-300/10
// text-heading → text-slate-100 (citation or title)
// text-body → text-slate-200 (content)
<blockquote class="border-l-[3px] border-sky-300 bg-sky-300/10 rounded-r-lg px-4 py-3 text-slate-200">
  {children}
</blockquote>
```

- [ ] **Step 8: Update `inline-code.tsx`**

```tsx
// bg-muted → bg-slate-700
// add text-sky-300 and border border-slate-600
<code class="bg-slate-700 text-sky-300 border border-slate-600 rounded px-1.5 py-0.5 text-[12px] font-mono">
  {children}
</code>
```

- [ ] **Step 9: Update `hr.tsx`**

```tsx
// bg-neutral-quaternary → bg-slate-600
<hr class="bg-slate-600 border-0 h-px my-6" />
```

- [ ] **Step 10: Update `list.tsx`**

```tsx
// text-body → text-slate-200
<ul class="text-slate-200 list-disc list-inside space-y-1">
  {children}
</ul>
```

(Or `<ol>` if that's what `list.tsx` renders — match whatever the file currently uses.)

- [ ] **Step 11: Run typography tests if they exist**

Run: `vitest run apps/ethang-hono/src/components/typography/`

Expected: PASS (or no tests found — typography components may not have dedicated unit tests)

- [ ] **Step 12: Commit**

```bash
git add apps/ethang-hono/src/components/typography/
git commit -m "feat(ethang-hono): update typography to midnight space palette"
```

---

## Task 6: Profile Card

**Files:**
- Modify: `apps/ethang-hono/src/components/cards/profile-card.tsx`

- [ ] **Step 1: Read the file**

Run: `mcp__webstorm__read_file` on `apps/ethang-hono/src/components/cards/profile-card.tsx`

- [ ] **Step 2: Replace all broken tokens**

| Old | New |
|---|---|
| `rounded-base` | `rounded-lg` |
| `border-default` | `border-slate-600` |
| `bg-neutral-primary-soft` or `bg-neutral-primary` | `bg-slate-800` |
| `text-heading` | `text-slate-100` |
| `text-body` | `text-slate-200` |
| `text-fg-brand` | `text-sky-300` |
| `shadow-*` (any existing shadow) | `shadow-[0_6px_24px_rgba(0,0,0,0.55)]` |

The profile card should use the Surface card design:
```tsx
<div class="bg-slate-800 border border-slate-600 rounded-lg shadow-[0_6px_24px_rgba(0,0,0,0.55)] [box-shadow:0_6px_24px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]">
```

- [ ] **Step 3: Commit**

```bash
git add apps/ethang-hono/src/components/cards/profile-card.tsx
git commit -m "feat(ethang-hono): update profile card to surface card design"
```

---

## Task 7: Course Components

**Files:**
- Modify (test first): `apps/ethang-hono/src/components/courses/courses-components.test.tsx`
- Modify: `apps/ethang-hono/src/components/courses/course-progress-bar.tsx`
- Modify: `apps/ethang-hono/src/components/courses/course-list.tsx`
- Modify: `apps/ethang-hono/src/components/courses/courses-container.tsx`

- [ ] **Step 1: Read all four files**

Read each file before modifying.

- [ ] **Step 2: Update the test file**

In `courses-components.test.tsx`, update broken token assertions:

| Old assertion | New assertion |
|---|---|
| `"bg-neutral-secondary-medium"` (INCOMPLETE status) | `"bg-slate-700"` |
| `"bg-warning"` (REVISIT status) | `"bg-amber-400/10"` |
| `"bg-brand"` (COMPLETE status) | `"bg-sky-300/10"` |
| Any `"text-brand"` | `"text-sky-300"` |
| Any `"border-default-medium"` | `"border-slate-600"` |

- [ ] **Step 3: Run the test to verify it fails**

Run: `vitest run apps/ethang-hono/src/components/courses/courses-components.test.tsx`

Expected: FAIL — assertions still reference old token names

- [ ] **Step 4: Update `course-progress-bar.tsx`**

```tsx
// Track: bg-neutral-quaternary → bg-slate-700 (or bg-slate-600)
// Fill (active): bg-brand → bg-sky-300
// Fill (warning): bg-warning → bg-amber-400
<div class="h-1 rounded-full bg-slate-600">
  <div class="h-full rounded-full bg-sky-300" style={`width: ${progress}%`} />
</div>
```

- [ ] **Step 5: Update `course-list.tsx`**

Status badge classes by status:

```tsx
// INCOMPLETE:
'bg-slate-700 border border-slate-500 text-slate-200'

// COMPLETE:
'bg-sky-300/10 border border-sky-300/30 text-sky-300'

// REVISIT:
'bg-amber-400/10 border border-amber-400/30 text-amber-400'
```

Also replace:
| Old | New |
|---|---|
| `border-default-medium` | `border-slate-600` |
| `text-brand` | `text-sky-300` |
| `focus:ring-brand` | `focus:ring-sky-300/20` |
| `bg-neutral-secondary-medium` | `bg-slate-700` |

- [ ] **Step 6: Update `courses-container.tsx`**

```tsx
// text-body → text-slate-200
// text-fg-purple → text-sky-300
// text-fg-warning-subtle → text-amber-400/70
// text-fg-brand-subtle → text-slate-300
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `vitest run apps/ethang-hono/src/components/courses/courses-components.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/ethang-hono/src/components/courses/
git commit -m "feat(ethang-hono): update course components to midnight space tokens"
```

---

## Task 8: Sign-in Form

**Files:**
- Modify: `apps/ethang-hono/src/components/routes/sign-in.tsx`

`★ Insight ─────────────────────────────────────`
The sign-in form uses the Input design from the spec: `bg-slate-900` (inset depth level) with `border-slate-600` default, transitioning to `border-sky-300` on focus with a `ring-sky-300/15` halo. This makes the form feel embedded in the page rather than floating on top — consistent with the inset card level of the depth stack.
`─────────────────────────────────────────────────`

- [ ] **Step 1: Read the file**

Run: `mcp__webstorm__read_file` on `apps/ethang-hono/src/components/routes/sign-in.tsx`

- [ ] **Step 2: Replace all broken tokens in the form container and card**

```tsx
// Form card (surface level):
<div class="bg-slate-800 border border-slate-600 rounded-lg shadow-[0_6px_24px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]">
```

Replace:
| Old | New |
|---|---|
| `rounded-base` | `rounded-lg` |
| `border-default-medium` | `border-slate-600` |
| `bg-neutral-secondary-medium` | `bg-slate-900` (inputs) / `bg-slate-800` (card) |
| `text-heading` | `text-slate-100` |

- [ ] **Step 3: Replace input classes**

```tsx
<input
  class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-300 focus:outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-300/15 transition-colors"
/>
```

Replace:
| Old | New |
|---|---|
| `placeholder:text-body` | `placeholder:text-slate-300` |
| `focus:border-brand` | `focus:border-sky-300` |
| `focus:ring-brand` or `focus:ring-brand-medium` | `focus:ring-sky-300/15` |

- [ ] **Step 4: Replace submit button classes**

The submit button should use the primary variant from the button system (Task 4). If it uses inline classes rather than `buttonClasses()`, update it to:

```tsx
<button
  class="w-full bg-sky-300/10 border border-sky-300/30 text-sky-300 font-heading font-semibold rounded-lg py-2 hover:bg-sky-300/20 hover:border-sky-300/50 focus:outline-none focus:ring-2 focus:ring-sky-300/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
>
```

Replace:
| Old | New |
|---|---|
| `bg-brand` | `bg-sky-300/10` |
| `hover:bg-brand-strong` | `hover:bg-sky-300/20` |
| `focus:ring-brand-medium` | `focus:ring-sky-300/30` |
| `disabled:bg-fg-disabled` | `disabled:opacity-40` |

- [ ] **Step 5: Replace error text**

```tsx
// text-danger → text-red-400
<p class="text-red-400 text-sm">{error}</p>
```

- [ ] **Step 6: Commit**

```bash
git add apps/ethang-hono/src/components/routes/sign-in.tsx
git commit -m "feat(ethang-hono): update sign-in form to midnight space design"
```

---

## Task 9: Blog Route

**Files:**
- Modify: `apps/ethang-hono/src/components/routes/blog.tsx`

- [ ] **Step 1: Read the file**

Run: `mcp__webstorm__read_file` on `apps/ethang-hono/src/components/routes/blog.tsx`

- [ ] **Step 2: Replace broken tokens**

| Old | New |
|---|---|
| `text-fg-brand` | `text-sky-300` |
| `text-fg-purple` | `text-sky-300` (no separate purple accent in new system) |
| `text-fg-brand-subtle` | `text-slate-300` |
| `text-body` | `text-slate-200` |
| `text-heading` | `text-slate-100` |
| `border-default` | `border-slate-600` |
| `bg-neutral-primary` | `bg-slate-800` |

- [ ] **Step 3: Commit**

```bash
git add apps/ethang-hono/src/components/routes/blog.tsx
git commit -m "feat(ethang-hono): update blog route to midnight space tokens"
```

---

## Task 10: E2E Verification

**Files:**
- No changes — read-only verification

- [ ] **Step 1: Run the full Vitest suite**

Run: `vitest run --project ethang-hono`

Expected: All tests PASS. Coverage thresholds maintained (do not lower any threshold).

If a test fails because a new class assertion was missed, go back to the relevant task, update the test first (red), then update the component (green).

- [ ] **Step 2: Run Playwright E2E tests**

Run the Playwright test suite for ethang-hono:

```bash
cd apps/ethang-hono && npx playwright test
```

Expected: All E2E tests PASS. The redesign is purely visual — it should not affect accessibility semantics, route behavior, or interactive behavior that E2E tests verify.

If a test fails due to a class name change that a test was asserting literally, update the test to the new class name.

- [ ] **Step 3: Final commit if any test fixes were needed**

```bash
git add -p
git commit -m "fix(ethang-hono): update test assertions for midnight space redesign"
```

---

## Self-Review Checklist

### Spec Coverage

| Spec Section | Covered By |
|---|---|
| `@theme` slate/sky/font overrides | Task 1 |
| Radial void background | Task 1 |
| Google Fonts import | Task 1 |
| Remove `dark` variant | Task 1 + Task 2 |
| Navigation design | Task 3 |
| Button tinted-border pattern | Task 4 |
| Typography type scale | Task 5 |
| Profile card depth level | Task 6 |
| Course status badges | Task 7 |
| Progress bar colors | Task 7 |
| Form/input design | Task 8 |
| Blog route tokens | Task 9 |
| E2E verification | Task 10 |

### Token Replacement Map Verification

Every broken token from the spec's §8 token replacement table is addressed:

| Broken Token | New Class | Task |
|---|---|---|
| `bg-dark` | `bg-slate-950` | T1/T2 |
| `bg-neutral-primary` | `bg-slate-800` | T3,T6,T9 |
| `bg-neutral-secondary-soft` | `bg-slate-700` | T3 |
| `bg-neutral-primary-soft` | `bg-slate-800` | T4,T6 |
| `border-default` | `border-slate-600` | T3,T5,T6,T9 |
| `text-heading` | `text-slate-100` | T5,T6,T8,T9 |
| `text-body` | `text-slate-200` | T3,T5,T7,T9 |
| `text-fg-brand` | `text-sky-300` | T5,T9 |
| `bg-brand` | `bg-sky-300/10 border-sky-300/30` | T3,T4,T7 |
| `bg-brand-strong` | `bg-sky-300/20` | T8 |
| `focus:ring-brand-medium` | `focus:ring-sky-300/15` | T8 |
| `rounded-base` | `rounded-lg` | T3,T4,T6,T8 |
| `bg-success` | `bg-green-400/10` | T4 |
| `bg-danger` | `bg-red-400/10` | T4 |
| `bg-warning` | `bg-amber-400/10` | T4,T7 |
