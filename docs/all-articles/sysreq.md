---
id: "SYSREQ-003"
type: system_requirement
name: "Flat Subscribed Articles Pagination"
specification: "The system SHALL allow API clients to fetch articles across all subscribed feeds of an account using cursor-based pagination (first, after) sorted by publishedAt DESC."
derives_from:
  - "SCEN-003"
---

# System Requirement: Flat Subscribed Articles Pagination

## Requirement Specification

> The system SHALL allow API clients to fetch articles across all subscribed feeds of an account using cursor-based pagination (first, after) sorted by publishedAt DESC.

## Rationale

Fetching a flat array of all articles from all subscriptions sorted by publication date is the standard way to present a "Main Feed" or "Timeline" view. Offloading pagination and sorting to the database prevents memory limits and performance degradation on the client side.

## Acceptance Criteria

- The query returns a standard `ArticleConnection` containing `edges` and `pageInfo`.
- The articles are ordered by `publishedAt DESC, id DESC`.
- The connection supports an optional `isRead` filter.
- Cursor values can be used as `after` parameters in subsequent requests.

## Verification Plan

- **Method**: Automated integration/unit tests on the GraphQL resolvers.
- **Procedure**: Seed articles with different publication dates, query `allArticles` with limit and cursor, and verify order and pagination cursor correctness.
