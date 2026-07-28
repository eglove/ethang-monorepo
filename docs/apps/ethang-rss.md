---
tags: [app, documentation, rss]
created: 2026-07-27
---

# ethang-rss

This Cloudflare Worker fetches RSS and Atom feeds. The worker parses the feeds and stores the data in a D1 SQLite database. The cron trigger runs every 15 minutes.

## Architecture

### Workflow

`FetchFeedsWorkflow` extends `WorkflowEntrypoint`. The workflow runs as a Cloudflare Workflow. Each execution follows this sequence:

1. **Get feeds** — Load all registered feeds from the `feeds` table.
2. **Fetch each feed** — For every feed:
   - Fetch XML from `feed.xmlAddress`.
   - Parse feed metadata and items via `fast-xml-parser` and Effect `Schema` validation.
   - Normalize items (title, link, guid, content, publishedAt).
   - Remove YouTube Shorts links.
   - Remove articles older than **90 days** (see Retention Policy).
   - Insert articles with `onConflictDoNothing` (unique on `feedId` and `guid`).
   - Update the feed row with `lastFetchedAt`. Update `title` and `website` if parsed metadata changed.
   - All database writes run inside a **D1 transaction**. On failure, the entire feed batch rolls back.
3. **Cleanup old articles** — Delete articles and their `user_item_states` entries that exceed the 90-day retention window. The cleanup runs in a separate transaction after all feeds are processed.

Each feed fetch uses `Effect.tryPromise` with `Effect.matchEffect`. The system catches and logs errors per feed. The workflow does not abort the remaining feeds. A failed feed is logged with `Effect.logError`. The workflow re-throws the error via `Effect.die`. The workflow step records the failure for observability.

### Transaction Boundaries

| Operation | Transaction? | Rollback on failure |
|-----------|-------------|-------------------|
| Per-feed inserts and feed update | Yes (`database.transaction`) | Yes — no partial articles left |
| Cleanup old articles | Yes (`database.transaction`) | Yes — deletions are atomic per chunk |

## Retention Policy

- **`ARTICLE_RETENTION_DAYS = 90`** — The system excludes articles older than 90 days at insert time.
- The `cleanupOldArticles` step removes existing articles older than 90 days. The step runs after all feeds finish.
- The cleanup deletes from `user_item_states` first. Then the system deletes from `articles`. The system processes 100 IDs per chunk.

## Database Schema

Tables are defined in `src/db/schema.ts`. The file uses Drizzle ORM and SQLite.

| Table | Primary Key | Key Constraint | Notes |
|-------|------------|----------------|-------|
| `feeds` | `id` (UUID v7) | unique(`xmlAddress`) | Stores feed metadata |
| `articles` | `id` (UUID v7) | unique(`feedId`, `guid`) | `feedId` references `feeds.id` with CASCADE delete |
| `subscriptions` | `id` (UUID v7) | unique(`userId`, `feedId`) | Maps users to feeds |
| `user_item_states` | `id` (UUID v7) | unique(`userId`, `articleId`) | Read and bookmark state per user per article |

## Key Exports

| Export | Module | Purpose |
|--------|--------|---------|
| `FetchFeedsWorkflow` | `src/cron/fetch-feeds-workflow.ts` | Cloudflare Workflow entrypoint |
| `fetchSingleFeed` | `src/cron/fetch-feeds-workflow.ts` | Fetch, parse, normalize, and insert one feed articles |
| `cleanupOldArticles` | `src/data/mutations/cleanup-old-articles.ts` | Delete articles and user states past retention window |
| `normalizeDate` | `src/util/normalize-date.ts` | Parse RSS date strings to ISO |
| `normalizeLink` | `src/cron/fetch-feeds-workflow.ts` | Handle Atom `<link>` arrays, RSS `<link>`, and fallbacks |
| `normalizeGuid` | `src/cron/fetch-feeds-workflow.ts` | Resolve guid from `<guid>`, `<id>`, or fallback to link |
| `normalizeContent` | `src/cron/fetch-feeds-workflow.ts` | Prefer description over content over summary |
| `normalizeTitle` | `src/cron/fetch-feeds-workflow.ts` | Fallback to "No Title" |

## Configuration

- **Cron schedule:** `*/15 * * * *` (every 15 minutes)
- **Database:** D1 (`ethang_rss` binding, remote)
- **Compatibility:** `2026-07-27`, `nodejs_compat`
- **Placement:** smart mode
- **Observability:** enabled, 100 percent head sampling
