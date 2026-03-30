# Project Functional Map (Living Doc)

## 🗺️ Discovered Workflows

### sterett-hono Page Test Pattern
**Trace:** `*.test.ts` → `test-utils/render.tsx` [renderXxxPage] → `components/pages/xxx-page.tsx` → `sanity/get-xxx.ts` → `clients/sanity-client.ts`

**Gotchas:**
- All page test files must be `.test.ts` (not `.tsx`) — Vitest config only picks up `src/**/*.test.ts`
- Every page test needs `vi.mock(import("../../clients/sanity-client.ts"), ...)` because pages import sanity functions which transitively import the client at module init time
- `TrusteesPage` (and any page rendering `TrusteeCard`) needs the **chainable** `sanityImage` mock: `{ image: () => ({ height: () => ({ width: () => ({ format: () => ({ url: () => "..." }) }) }) }) }` — without it the image URL builder throws
- Pages that accept data as props (e.g. `NewsPage({ items })`) do NOT need the data-fetching function mocked if the prop is always provided; the sanity-client mock alone is sufficient
- `vi.mocked(fn).mockResolvedValue(...)` — only add `// @ts-expect-error for test` if TypeScript actually flags the call; omitting the comment when unnecessary causes `TS2578: Unused '@ts-expect-error' directive` lint error

## 🔍 Search Hints & Hotspots
