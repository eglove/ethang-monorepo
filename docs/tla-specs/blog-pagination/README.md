# Blog Pagination TLA+ Specification

## Overview

Formal specification modeling the pagination state machine for the ethang-hono blog listing page.

## Files

| File | Description |
|------|-------------|
| `BlogPagination.tla` | TLA+ specification module |
| `BlogPagination.cfg` | TLC model checking configuration |
| `README.md` | This file |

## Model

### States
- `Idle` -- awaiting request
- `Parsing` -- raw URL segment being parsed into a page number (C2)
- `Validating` -- page number parsed, checking bounds
- `Rendering` -- rendering the page
- `Redirecting` -- issuing a redirect

### Constants
| Constant | Description | Model Value |
|----------|-------------|-------------|
| `TotalPosts` | Total number of blog posts | 30 |
| `PageSize` | Posts per page | 10 |
| `MaxPage` | Derived: `(TotalPosts + PageSize - 1) / PageSize` | 3 (M2) |

### Input Types (M3)
| Input | URL Pattern | Meaning |
|-------|-------------|---------|
| `"none"` | -- | No request pending (idle) |
| `"root"` | `GET /blog` | Root blog page |
| `"empty_segment"` | `GET /blog/page/` | Trailing slash, no page number (C1) |
| `"one"` | `GET /blog/page/1` | Page 1 |
| `"valid"` | `GET /blog/page/n` (1 < n <= MaxPage) | Valid page |
| `"over_max"` | `GET /blog/page/n` (n > MaxPage) | Page exceeds maximum |
| `"zero"` | `GET /blog/page/0` | Page zero |
| `"negative"` | `GET /blog/page/-n` | Negative page |
| `"invalid"` | `GET /blog/page/abc` | Non-numeric input |

### Transitions
| Trigger | Condition | Path | Redirect Type |
|---------|-----------|------|---------------|
| `GET /blog` | root | Idle -> Parsing -> Rendering (page 1) | -- |
| `GET /blog/page/` | empty_segment | Idle -> Parsing -> Redirecting (/blog) | 302 (C1) |
| `GET /blog/page/1` | one | Idle -> Parsing -> Redirecting (/blog) | 301 (M1) |
| `GET /blog/page/n` (1 < n <= MaxPage) | valid | Idle -> Parsing -> Validating -> Rendering | -- |
| `GET /blog/page/n` (n > MaxPage) | over_max | Idle -> Parsing -> Redirecting (max page) | 302 |
| `GET /blog/page/0` | zero | Idle -> Parsing -> Redirecting (/blog) | 302 |
| `GET /blog/page/-n` | negative | Idle -> Parsing -> Redirecting (/blog) | 302 |
| `GET /blog/page/abc` | invalid | Idle -> Parsing -> Redirecting (/blog) | 302 |

### Safety Properties (Verified)
1. **NoNegativePageRendered** -- No page < 1 is ever rendered
2. **PageOneIsRoot** (M5) -- Page 1 is only rendered via `/blog`; `/blog/page/1` always 301-redirects to `/blog`
3. **RedirectIsValid** -- All redirect URLs are valid targets
4. **RenderedPageWithinBounds** -- Rendered page never exceeds MaxPage
5. **RedirectTypeInvariant** (M1) -- 301 only for canonical `/blog/page/1` -> `/blog`, 302 for all others
6. **InvalidNeverRenders** (M4) -- Invalid inputs (`invalid`, `negative`, `zero`, `empty_segment`, `over_max`) never reach Rendering state

### Liveness Property
- **EventuallyResolves** (C3) -- Every request that enters Parsing state eventually reaches Rendering or Redirecting. Verified via `LiveSpec` with weak fairness on Reset actions.

## Review Objections Addressed

| ID | Severity | Objection | Resolution |
|----|----------|-----------|------------|
| C1 | Critical | Missing `/blog/page/` transition | Added `ParseEmptySegment` transition |
| C2 | Critical | No explicit input parsing step | Added `Parsing` state; all inputs flow Idle -> Parsing -> ... |
| C3 | Critical | `EventuallyResolves` only checked reset | Rewritten to verify Parsing -> Rendering/Redirecting |
| M1 | Moderate | No 301 vs 302 distinction | Added `redirectType` variable; 301 for canonical, 302 otherwise |
| M2 | Moderate | `MaxPage` as bare constant | Derived from `TotalPosts` and `PageSize` via ceiling division |
| M3 | Moderate | Ambiguous `"empty"` input | Split into `"none"` (no request) and `"root"` (GET /blog) |
| M4 | Moderate | No safety property for invalid inputs | Added `InvalidNeverRenders` invariant |
| M5 | Moderate | Weak `PageOneIsRoot` property | Strengthened to cover both rendering and redirect conditions |

## TLC Results

**Model parameters:** `TotalPosts = 30`, `PageSize = 10` (implies `MaxPage = 3`)

| Metric | Value |
|--------|-------|
| States generated | 36 |
| Distinct states | 25 |
| Invariant violations | **0** |
| Safety properties | **All 6 pass** |
| State graph depth | 4 |

## How to Run

```bash
cd docs/tla-specs/blog-pagination
java -XX:+UseParallelGC -jar tla2tools.jar BlogPagination.tla
```

Requires Java 17+ and `tla2tools.jar` (downloaded in this directory).
