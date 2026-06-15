---
id: "SOL-003"
type: solution
name: "Unified Paginated Subscription Articles Query"
specification: "The system SHALL expose a unified paginated GraphQL query that returns articles from all feeds subscribed to by an account in a flat array, sorted by publication date."
---

# Solution: Unified Paginated Subscription Articles Query

## Summary

This solution implements a unified paginated query (`allArticles`) in the RSS GraphQL service. It allows clients to query a flat list of all articles from all subscriptions of the authenticated account, sorted by `publishedAt` (descending), using cursor-based pagination.
