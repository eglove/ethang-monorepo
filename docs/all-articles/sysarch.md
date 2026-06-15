---
id: "SYSARCH-003"
type: system_architecture
name: "GraphQL Schema and Subgraph Integration"
specification: "The RSS subgraph schema SHALL define the allArticles query returning an ArticleConnection, and the gateway SHALL expose it as a federated field."
satisfies:
  - "SYSREQ-003"
---

# System Architecture: GraphQL Schema and Subgraph Integration

## Description

The `allArticles` query is added to the root `Query` type of the RSS subgraph schema (`apps/ethang-rss/src/graphql/schema.graphql`). The gateway federates it so that clients query it through the unified `apps/ethang-graphql` endpoint.

## Architecture Tactics

- **Performance**: We use SQL joins on `subscriptions` and `articles` tables rather than loading all subscriptions and doing multiple queries, ensuring a single efficient SQLite query.
- **Security**: The query relies on the authenticated context `context.user.sub` to ensure users can only view articles from feeds they are subscribed to.
