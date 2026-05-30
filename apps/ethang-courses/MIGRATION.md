# Course Tracking Data Migration

This app includes a repeatable sync script that upserts all course-tracking rows from the old D1 database into the new one.

## Prerequisites

- Wrangler is authenticated.
- `ethang-courses` table has been created (apply migrations first).

## Run a sync

From `apps/ethang-courses`:

```bash
pnpm migrate:sync
```

Optional database overrides:

```bash
SOURCE_D1_DATABASE=ethang-hono TARGET_D1_DATABASE=ethang-courses pnpm migrate:sync
```

## No-freeze cutover flow

1. Run `pnpm migrate:sync`.
2. Deploy gateway + Hono changes.
3. Run `pnpm migrate:sync` again for a final delta upsert.
4. Verify counts and route behavior.
