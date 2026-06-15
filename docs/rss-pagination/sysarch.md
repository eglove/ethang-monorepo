---
id: "SYSARCH-002"
type: system_architecture
name: "Apollo Cache Merge Policies and fetchMore Integration"
platform: "React (Vite) & Apollo Client"
satisfies:
  - "SYSREQ-002"
---

# Architecture: Apollo Cache Merge Policies and fetchMore Integration

## Technical Strategy

The frontend will use Apollo Client's `useQuery` hook. When the user triggers "Load More", `fetchMore` will be called with the `after` cursor retrieved from `pageInfo.endCursor`. To ensure the incoming items are appended to the existing list instead of replacing them, Apollo Client's cache type policies will define merge functions for `subscriptions` and `feedArticles`.

## Static View (Structure)

```mermaid
graph TD
    App[RSS Component] --> Hook[useQuery + fetchMore]
    Hook --> Cache[Apollo InMemoryCache]
    Cache --> Merge[Cache TypePolicies / Merge Functions]
```

## Dynamic View (Behavior)

```mermaid
sequenceDiagram
    participant U as UI Component
    participant A as Apollo Client
    participant S as Server
    U->>A: fetchMore(after)
    A->>S: Query(after)
    S-->>A: Return Page(edges, pageInfo)
    A->>A: Merge edges in Cache
    A->>U: Update React state with merged list
```
