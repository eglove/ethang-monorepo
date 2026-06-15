---
id: "SCEN-003"
type: scenario
name: "Paginated Flat Article Feed Query Scenario"
refines:
  - "UC-003"
---

# Scenario: Paginated Flat Article Feed Query Scenario

## Description

1. The API client requests `allArticles` with `first: 20` and `isRead: false`.
2. The system fetches the authenticated user's subscriptions.
3. The system joins the subscriptions with the articles table, filters by `isRead = false` (or not read), and sorts by `publishedAt DESC, id DESC`.
4. The system returns the first 20 articles and a cursor pointing to the last item.
5. The API client makes a subsequent request passing the returned cursor as `after`.
6. The system returns the next page of articles.
