---
tags: [app, documentation, rss]
created: 2026-07-27
---

# ethang-rss

Cloudflare Worker that fetches, parses, and stores RSS/Atom feeds into a D1 SQLite database. Triggered every 15 minutes via cron.

## Architecture

### Workflow

`FetchFeedsWorkflow` extends `WorkflowEntrypoint` and runs as a Cloudflare Workflow bound to the worker. Each execution follows this sequence:

1. **Get feeds** — Load all registered feeds from the `feeds` table.
2. **Fetch each feed** (sequential, per-feed step) — For every feed:
   - Fetch XML from `feed.xmlAddress`.
   - Parse feed metadata and items via `fast-xml-parser` + Effect `Schema` validation.
   - Normalize items (title, link, guid, content, publishedAt).
   - Filter out YouTube Shorts links.
   - Filter out articles older than **90 days** (see Retention Policy).
   - Insert articles with `onConflictDoNothing` (unique on `feedId` + `guid`).
   - Update the feed row with `lastFetchedAt`, and `title`/`website` if parsed metadata changed.
   - All database writes run inside a **D1 transaction** — on failure, the entire feed batch rolls back with no partial inserts.
3. **Cleanup old articles** — Delete articles and their `user_item_states` entries that exceed the 90-day retention window. Runs in a separate transaction after all feeds are processed.

Each feed fetch is wrapped in `Effect.tryPromise` with `Effect.matchEffect` to catch and log errors per-feed without aborting the remaining feeds. A failed feed is logged with `Effect.logError` and re-thrown via `Effect.die` so the Workflow step records the failure for observability.

### Transaction Boundaries

| Operation | Transaction? | Rollback on failure |
|-----------|-------------|-------------------|
| Per-feed inserts + feed update | Yes (`database.transaction`) | Yes — no partial articles left |
| Cleanup old articles | Yes (`database.transaction`) | Yes — deletions atomic per chunk |

## Retention Policy

- **`ARTICLE_RETENTION_DAYS = 90`** — Articles published more than 90 days ago are excluded at insert time.
- Existing articles older than 90 days are removed by the `cleanupOldArticles` step after all feeds finish.
- Cleanup deletes from `user_item_states` first (child table), then `articles` (parent table), in chunks of 100 IDs.

## Database Schema

Tables are defined in `src/db/schema.ts` using Drizzle ORM + SQLite.

| Table | Primary Key | Key Constraint | Notes |
|-------|------------|----------------|-------|
| `feeds` | `id` (UUID v7) | unique(`xmlAddress`) | Stores feed metadata |
| `articles` | `id` (UUID v7) | unique(`feedId`, `guid`) | `feedId` references `feeds.id` with CASCADE delete |
| `subscriptions` | `id` (UUID v7) | unique(`userId`, `feedId`) | Maps users to feeds |
| `user_item_states` | `id` (UUID v7) | unique(`userId`, `articleId`) | Read/bookmark state per user per article |

## Key Exports

| Export | Module | Purpose |
|--------|--------|---------|
| `FetchFeedsWorkflow` | `src/cron/fetch-feeds-workflow.ts` | Cloudflare Workflow entrypoint |
| `fetchSingleFeed` | `src/cron/fetch-feeds-workflow.ts` | Fetch, parse, normalize, and insert one feed's articles |
| `cleanupOldArticles` | `src/data/mutations/cleanup-old-articles.ts` | Delete articles and user states past retention window |
| `normalizeDate` | `src/util/normalize-date.ts` | Parse RSS date strings to ISO |
| `normalizeLink` | `src/cron/fetch-feeds-workflow.ts` | Handle Atom `<link>` arrays, RSS `<link>`, and fallbacks |
| `normalizeGuid` | `src/cron/fetch-feeds-workflow.ts` | Resolve guid from `<guid>`, `<id>`, or fallback to link |
| `normalizeContent` | `src/cron/fetch-feeds-workflow.ts` | Prefer description > content > summary |
| `normalizeTitle` | `src/cron/fetch-feeds-workflow.ts` | Fallback to "No Title" |

## Configuration

- **Cron schedule:** `*/15 * * * *` (every 15 minutes)
- **Database:** D1 (`ethang_rss` binding, remote)
- **Compatibility:** `2026-07-27`, `nodejs_compat`
- **Placement:** smart mode
- **Observability:** enabled, 100% head sampling
