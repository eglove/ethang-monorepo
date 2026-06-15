---
id: "SWREQ-003"
type: software_requirement
name: "Drizzle Query for All Subscribed Articles"
specification: "The RSS GraphQL resolver SHALL query articles from the articlesTable joined with the subscriptionsTable filtered by userId, utilizing a publishedAt and id tie-breaker cursor query."
derives_from:
  - "SYSARCH-003"
---

# Software Requirement: Drizzle Query for All Subscribed Articles

## Requirement Specification

> The RSS GraphQL resolver SHALL query articles from the articlesTable joined with the subscriptionsTable filtered by userId, utilizing a publishedAt and id tie-breaker cursor query.

## Rationale

To support cursor-based pagination over a non-unique sort field (`publishedAt`), the SQL query must tie-break using a unique field (`id`) and fetch elements strictly after the composite cursor `[publishedAt, id]`.

## Acceptance Criteria

- The resolver parses the `after` cursor into a `[publishedAt, id]` tuple.
- The SQL query retrieves items where `(publishedAt < cursorPublishedAt) OR (publishedAt = cursorPublishedAt AND id < cursorId)`.
- Null values of `publishedAt` are correctly handled (ordered last).
