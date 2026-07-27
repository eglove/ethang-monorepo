---
tags:
  - backlog
  - rss
  - workflow
status: todo
priority: medium
created: 2026-07-26
---

# Ethang RSS Workflow — Transactional Updates

## Goal

Update the `ethang-rss` workflow so all CRUD operations (create, update, delete feeds/sources) happen in a single transaction per run, instead of sequential individual calls.

## Current State

- Workflow handles feeds individually
- Multiple network calls per run
- Partial failures leave inconsistent state

## Proposed Approach

- Wrap all mutations in one atomic unit
- Use a batch API or transaction block
- Roll back entirely on any failure

## Plan

1. Audit the current `ethang-rss` workflow code — list every HTTP call and mutation point
2. Identify the batch/transaction API (Cloudflare Queues? D1 batch? Workers KV bulk?)
3. Write failing test: simulate a partial failure and assert no partial state persisted
4. Implement transactional wrapper
5. Verify: full success commits all; any failure commits none
6. Update monitoring/alerting for the new pattern

## Risks

- Batch API may have size limits
- Existing consumers may depend on incremental updates

## Related

- [[Package Cleanup — Remove Dead Packages]] (if RSS uses packages slated for deletion)
