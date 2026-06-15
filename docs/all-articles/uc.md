---
id: "UC-003"
type: use_case
name: "Flat Paginated Subscription Articles Feed"
refines:
  - "SOL-003"
---

# Use Case: Flat Paginated Subscription Articles Feed

## Actor(s)

- **Primary Actor**: End User / API Client

## Pre-conditions

- The user is authenticated.
- The user has active RSS feed subscriptions.
- Subscribed feeds contain articles.

## Main Success Outcome

The API client can request a flat list of articles across all subscriptions, sorted by `publishedAt` (newest first), with cursor-based pagination parameters (`first`, `after`).

## Key Functional Scope

- **Retrieve Flat Feed**: Query all articles across all subscribed feeds.
- **Cursor Pagination**: Use cursor-based pagination to fetch successive pages.
- **Sort by Publication Date**: Results must be sorted by `publishedAt DESC`, with `id DESC` as a tie-breaker.
- **Read State Filtering**: Support filtering articles by `isRead` status.
