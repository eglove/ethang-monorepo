# E2E Test Repair — Post Midnight Space Redesign

**Date:** 2026-03-29
**App:** `apps/ethang-hono`
**Branch:** `feature/e2e-a11y-expansion`

## Context

A major UI redesign ("midnight space") updated design tokens, navigation markup, button variants, typography, and form components throughout ethang-hono. The e2e test suite was expanded alongside this work but many tests have not yet been run. Tests and components both need verification.

## Goal

Bring all e2e tests to a fully green state against the redesigned app, validating both that each test correctly describes the intended behavior and that the app correctly implements it.

## Triage Rule

For every failure, evaluate both sides:

1. **Is the test correct?** — Right selectors, realistic interaction, valid aria expectation?
2. **Is the app correct?** — Does the redesigned component implement the described behavior?

- Test wrong → fix the test
- App wrong → fix the component
- Both wrong → fix both
- Never skip or weaken a test to make it pass

## Test Suite Structure

| Category | Config | Browsers (full run) |
|---|---|---|
| Mouse | `playwright.config.ts` (`mouse-*` projects) | Desktop Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari |
| Keyboard | `playwright.config.ts` (`keyboard-*` projects) | Same 5 |
| Broken links | `playwright.config.ts` (`broken-links` project) | Desktop Chrome |
| Screen-reader | `playwright.screen-reader.config.ts` | Desktop Chrome (NVDA via @guidepup) |

Mouse tests use the axe fixture — accessibility violations are treated as real failures, fix the component.

Screen-reader tests use `retries: 2` and a 5-minute timeout. A failure must reproduce consistently before treating it as real (not a flake).

## Phases

### Phase 1 — Mouse tests (Chromium only)

Run `mouse-chromium` project. Fix selector mismatches, changed text content, and axe violations. Axe violations require component fixes, not test relaxation.

### Phase 2 — Keyboard tests (Chromium only)

Run `keyboard-chromium` project. Focus on ARIA attributes, element IDs, focus management, and keyboard interaction behavior. Apply the dual triage rule.

### Phase 3 — Screen-reader tests (Chromium only, NVDA)

Run `playwright.screen-reader.config.ts`. Validate both that content is announced and that the announced text is comfortable — no redundant phrases (e.g., "link link Home"), no aria-labels that repeat visible text unnecessarily, no verbose role announcements. Poor screen-reader UX is a component fix.

### Phase 4 — Full browser matrix

Once all three categories are green on Chromium, run the complete config across all 5 browsers plus broken-links. Failures at this stage are expected to be browser-specific quirks. Confirm a final clean run across all projects.

## Success Criteria

- All mouse, keyboard, and broken-links tests pass on all 5 browser/device combinations
- All screen-reader tests pass on Desktop Chrome with NVDA
- No tests skipped or weakened to achieve green
- Screen-reader output is concise and free of redundant announcements
