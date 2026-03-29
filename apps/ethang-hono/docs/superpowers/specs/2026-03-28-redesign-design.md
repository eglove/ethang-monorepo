# ethang-hono Redesign — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Scope:** Complete visual redesign from scratch — replacing all broken Flowbite-era tokens with a new design system built on Tailwind v4 `@theme` overrides.

---

## 1. Background & Goal

Removing Flowbite broke all custom design tokens (`bg-dark`, `bg-neutral-primary`, `border-default`, `text-heading`, `bg-brand`, `rounded-base`, etc.). These are referenced throughout every component but resolve to nothing in the compiled CSS.

The goal is a complete redesign — not a patch — with a midnight/space aesthetic: dark layered depth, a feeling of falling through infinite space, achieved entirely through color and typography. No star graphics, no sky imagery. The elements themselves provide depth through tonal layering.

---

## 2. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Palette direction | Deep blue-black tonal stack | Small tonal variances working together rather than a few high-contrast colors |
| Accent color | Steel blue `#7dd3fc` — solid, no gradient | Subtle and cool; harmonious with the base palette |
| Background | Radial void at center, ambient at edges | Creates "falling into infinite space" sensation without graphics |
| Typography — headings | Space Grotesk | Geometric precision with space-adjacent character; not gimmicky |
| Typography — body | Inter | Gold standard for dark UI text; crisp antialiasing |
| Interactive element style | Tinted border (not solid fill) | All buttons/badges/active states use `color 10% bg + 30% border`; belongs in the depth stack rather than punching through it |
| Implementation approach | Token-first via Tailwind v4 `@theme` | Override existing Tailwind palettes (`slate`, `sky`) rather than inventing new token names |

---

## 3. Color System

All colors are defined as Tailwind v4 `@theme` overrides in `src/index.css`. No new token names — existing Tailwind palette names remapped to our values.

### Depth Stack → `slate` overrides

The six tonal layers are the core of the space aesthetic. Elements sit at different depths; the eye reads layering as spatial distance.

| Token | Value | Usage |
|---|---|---|
| `slate-950` | `#010102` | Page void — `<html>` background |
| `slate-900` | `#080b12` | Body — `<body>` background, inset elements |
| `slate-800` | `#0c1220` | Surface — base card/panel background |
| `slate-700` | `#111929` | Raised — interactive rows, sub-panels above surface |
| `slate-600` | `#1c2438` | Border — default border color |
| `slate-500` | `#2a3650` | Subtle — hover borders, secondary dividers |
| `slate-400` | `#3a4a68` | Active border — focused/pressed border |
| `slate-300` | `#5e7394` | Muted text — captions, labels, placeholders |
| `slate-200` | `#9aadc8` | Body text — paragraph content, secondary UI |
| `slate-100` | `#dde3f0` | Heading text — primary text, high emphasis |

### Accent → `sky` overrides

| Token | Value | Usage |
|---|---|---|
| `sky-300` | `#7dd3fc` | Accent — links, active nav, button text/border, focus ring |
| `sky-900` | `#0d2a3f` | Accent tint bg — button/badge background, accent card bg |

The interactive element formula:
- Background: `color-mix(in srgb, sky-300 12%, transparent)` → maps to `sky-900` for solid reference
- Border: `color-mix(in srgb, sky-300 30%, transparent)`
- Hover background: `color-mix(in srgb, sky-300 20%, transparent)`

### Semantic colors (danger / success / warning)

All use the same tinted-border formula as the accent. No solid fills anywhere.

| Semantic | Value |
|---|---|
| Danger | `#f87171` |
| Success | `#4ade80` |
| Warning | `#fbbf24` |

---

## 4. Background Treatment

Set on `html` as a CSS `background` property in `src/index.css` `@layer base`. Not a Tailwind utility — it's a multi-stop custom value.

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
  }
}
```

**Character:** Pure void at center (darkest point — what you're falling into), barely-perceptible ambient at edges. Creates the sensation of falling through infinite space. The `background-attachment: fixed` prevents the gradient scrolling with content, maintaining the illusion as the user moves down the page.

---

## 5. Typography

Set via Tailwind v4 `@theme` font family overrides:

```css
@theme {
  --font-sans:    'Inter', system-ui, sans-serif;
  --font-heading: 'Space Grotesk', system-ui, sans-serif;
}
```

Note: `--font-display` is avoided — it conflicts with Tailwind's existing `font-display` utility (used for `font-display: swap`). The utility class from `--font-heading` is `font-heading`.

Google Fonts import (both weights, both families):
```
Space Grotesk: wght 400;500;600;700
Inter: wght 300;400;500 + italic 300
```

### Type Scale

| Role | Font | Size | Weight | Color |
|---|---|---|---|---|
| Display | Space Grotesk | 28px | 700 | `slate-100` |
| H1 | Space Grotesk | 22px | 700 | `slate-100` |
| H2 | Space Grotesk | 16px | 600 | `slate-100` |
| H3 | Space Grotesk | 13px | 600 | `slate-100` |
| Body | Inter | 14px | 400 | `slate-200` |
| Small | Inter | 12px | 400 | `slate-200` |
| Caption | Inter | 11px | 400 | `slate-300` |
| Label | Space Grotesk | 10px | 600 | `slate-300` |
| Link | Inter | 14px | 500 | `sky-300` |
| Code inline | Monospace | 12px | 400 | `sky-300` on `slate-700` bg |

Headings use Space Grotesk. Body copy, captions, and form labels use Inter. Button and nav text use Space Grotesk (UI chrome = display font).

---

## 6. Component Design Language

### Cards — Depth Stack

Four card levels create spatial hierarchy:

| Level | Background | Border | Shadow | Usage |
|---|---|---|---|---|
| Surface | `slate-800` | `slate-600` | `0 6px 24px rgba(0,0,0,0.55)` + top inset highlight | Base content panels |
| Raised | `slate-700` | `slate-500` | `0 2px 10px rgba(0,0,0,0.45)` + top inset highlight | Interactive rows, sub-panels |
| Inset | `slate-900` | `slate-600` | `inset 0 1px 4px rgba(0,0,0,0.5)` | Code blocks, input backgrounds |
| Accent tint | `sky-900` (12%) | `sky-300` (30%) | none | Highlighted info, active regions |

All surface and raised cards include `inset 0 1px 0 rgba(255,255,255,0.04)` — a top-edge highlight simulating a light source from the front.

### Buttons

All variants use the tinted-border pattern. No solid fills.

| Variant | Background | Border | Text |
|---|---|---|---|
| Primary | sky 12% | sky 30% | `sky-300` |
| Secondary | `slate-700` | `slate-500` | `slate-200` |
| Ghost | transparent | transparent | `slate-200` |
| Danger | red 10% | red 30% | `#f87171` |
| Success | green 10% | green 30% | `#4ade80` |

Hover state: background opacity increases (12% → 20%), border opacity increases (30% → 50%).
Disabled state: `opacity: 0.4`, `cursor: not-allowed`.

Sizes: `xs` (11px/4px 10px), `sm` (12px/5px 12px), `base` (13px/7px 16px), `lg` (15px/10px 22px).

### Navigation

- Container: `slate-800` bg, `slate-600` bottom border, `box-shadow: 0 4px 20px rgba(0,0,0,0.4)`
- Brand: Space Grotesk 700, `slate-100`
- Links: Space Grotesk 500, `slate-200`, hover → `slate-700` bg + `slate-100` text
- Active link: same tinted treatment as primary button (`sky-900` bg, `sky-300` border, `sky-300` text)
- Fixed position, `z-index: 20`
- Mobile: hamburger toggle (existing behavior preserved)

### Form Elements

- Input background: `slate-900` (inset level)
- Input border: `slate-600` default → `sky-300` on focus
- Focus ring: `0 0 0 3px color-mix(in srgb, sky-300 15%, transparent)`
- Label: Space Grotesk, 11px, uppercase, `slate-300`
- Placeholder: `slate-300`

### Badges

Same tinted-border formula as buttons, at pill scale (`border-radius: 99px`, 10px/2px 7px).

### Progress Bar

Track: `slate-600`. Fill: `sky-300`. Height: 4px, fully rounded.

### Links

Color: `sky-300`. Hover: `border-bottom: 1px solid sky-300`. No underline at rest.

### Code blocks (inline)

`sky-300` text on `slate-700` bg, `slate-600` border, 4px radius.

### Code blocks (block / `pre`)

Background: `slate-900` (inset), `slate-600` border, `inset 0 1px 4px rgba(0,0,0,0.5)` shadow. Existing `hljs` theme retained (Night Owl), with comment contrast fix at `#93b5bf`.

### Blockquotes

Left border: 3px solid `sky-300`. Background: sky tint (12%). Right corners rounded.

---

## 7. Interactive State Machine

| State | Trigger | Visual |
|---|---|---|
| Default | — | As defined above |
| Hover | `mouseenter` (on hover devices) | Lighter bg, stronger border |
| Focus | Keyboard / click | `sky-300` border + 3px sky tint ring |
| Active/pressed | `mousedown` | `slate-600` bg for secondary/ghost |
| Disabled | `disabled` attr | 40% opacity, `cursor: not-allowed` |
| Loading | JS-controlled | Same as disabled + spinner icon |
| Current page (nav) | Route match | Tinted sky treatment on nav link |

Invalid transitions: A disabled button cannot enter hover or focus states (`pointer-events: none`).

---

## 8. Implementation Notes

### What to replace

Every broken token in components maps to a standard Tailwind class:

| Old token (broken) | New Tailwind class |
|---|---|
| `bg-dark` | `bg-slate-950` |
| `bg-neutral-primary` | `bg-slate-800` |
| `bg-neutral-secondary-soft` | `bg-slate-700` |
| `bg-neutral-primary-soft` | `bg-slate-800` |
| `border-default` | `border-slate-600` |
| `text-heading` | `text-slate-100` |
| `text-body` | `text-slate-200` |
| `text-fg-brand` | `text-sky-300` |
| `bg-brand` | sky tinted (`bg-sky-900/30 border-sky-300/30`) |
| `bg-brand-strong` | sky hover (`bg-sky-300/20`) |
| `focus:ring-brand-medium` | `focus:ring-sky-300/20` |
| `rounded-base` | `rounded-lg` (0.5rem) |
| `bg-success` | success tinted |
| `bg-danger` | danger tinted |
| `bg-warning` | warning tinted |

### Google Fonts

Replace the existing Open Sans import in `src/index.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:ital,wght@0,300;0,400;0,500;1,300&display=swap');
```

### `@theme` block additions

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

### Files touching order (suggested)

1. `src/index.css` — `@theme` overrides, background, font import
2. `src/components/layouts/main-layout.tsx` — html/body bg classes
3. `src/components/navigation/navigation.tsx` and sub-components
4. `src/components/button/button-classes.ts` — all variants
5. `src/components/typography/*` — link, h1–h3, p, blockquote, inline-code
6. `src/components/cards/profile-card.tsx`
7. `src/components/courses/*`
8. `src/components/routes/*` — page-level layout classes
9. Verify E2E tests still pass (visual styling changes should not affect a11y or behavior)
