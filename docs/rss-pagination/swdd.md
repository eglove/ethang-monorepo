---
id: "SWDD-002"
type: software_detailed_design
name: "Detailed Pagination Logic and UI Components"
satisfies:
  - "SWREQ-002"
---

# Software Implementation: Detailed Pagination Logic and UI Components

## Overview

The `Feeds` and `Articles` components in `apps/ethang-react` will be updated to fetch data in pages using `useQuery` variables and call `fetchMore` on click of the "Load More" button.

## Interface & API Definitions

### 1. Apollo Cache Type Policies (`apps/ethang-react/src/clients/apollo.ts`)
```typescript
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        subscriptions: {
          keyArgs: ["sortBy"],
          merge(existing = { edges: [] }, incoming) {
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges]
            };
          }
        },
        feedArticles: {
          keyArgs: ["feedId", "isRead"],
          merge(existing = { edges: [] }, incoming) {
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges]
            };
          }
        }
      }
    }
  }
});
```

### 2. UI Modifications
- **Feeds**: Fetch `subscriptions(first: 10, sortBy: { field: TITLE, direction: ASC })` by default. Render a Radix UI "Load More" button at the bottom of the feed list if `data.subscriptions.pageInfo.hasNextPage` is true.
- **Articles**: Fetch `feedArticles(feedId: $feedId, first: 20)` by default. Render a Radix UI "Load More" button below the article cards if `data.feedArticles.pageInfo.hasNextPage` is true.

## Error Handling & Edge Cases

- **Loading State**: The "Load More" button should show a loading indicator or disable during fetches.
- **Empty List**: If `edges` is empty, no button or list items are shown.
- **Duplicate Keys**: The cache merge function uses unique cursors, but React key properties must use the unique `node.id`.
