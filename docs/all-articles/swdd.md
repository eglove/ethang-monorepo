---
id: "SWDD-003"
type: software_detailed_design
name: "allArticles Resolver and Schema Update"
specification: "The system SHALL define the allArticlesQuery resolver in apps/ethang-rss/src/graphql/queries/all-articles.ts and register it in resolvers.ts."
satisfies:
  - "SWREQ-003"
---

# Software Detailed Design: allArticles Resolver and Schema Update

## Component Design

- **GraphQL schema**: `allArticles(first: Int, after: String, isRead: Boolean): ArticleConnection!` is added to `Query`.
- **Resolver**: `allArticlesQuery(database: Database)` in `all-articles.ts` implements the resolver function.
- **Routing**: Registered in `resolvers.ts`.

## Data Flow Diagram

```mermaid
graph TD
  Client[GraphQL Client] -->|allArticlesQuery| Gateway[GraphQL Gateway]
  Gateway -->|Sub-request| Subgraph[RSS Subgraph]
  Subgraph -->|Resolver| DB[(Drizzle DB)]
```
