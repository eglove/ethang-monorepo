---
id: "SYSREQ-002"
type: system_requirement
name: "Cursor-based Frontend Pagination"
specification: "The system SHALL allow the frontend to paginate subscriptions and feedArticles using GraphQL cursor parameters (first and after)."
derives_from:
  - "SCEN-002"
---

# System Requirement: Cursor-based Frontend Pagination

## Requirement Specification

> The system SHALL allow the frontend to paginate subscriptions and feedArticles using GraphQL cursor parameters (first and after).

## Rationale

Cursor-based pagination is necessary to guarantee stable page offsets as new RSS feeds or articles are imported asynchronously in the background.

## Acceptance Criteria

- Initial load fetches at most 10 subscriptions.
- Selecting a feed fetches at most 20 articles.
- "Load More" button only appears when `hasNextPage` is true in `pageInfo`.

## Verification Plan

- **Method**: Demonstration and automated unit tests.
- **Procedure**: Mock Apollo queries with `hasNextPage: true` and assert that the "Load More" button is rendered.
