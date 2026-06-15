---
id: "SWREQ-002"
type: software_requirement
name: "Apollo Cache Merge Policies"
specification: "The Apollo Client InMemoryCache SHALL define type policies to merge incoming paginated results for the subscriptions and feedArticles fields."
derives_from:
  - "SYSARCH-002"
---

# Software Requirement: Apollo Cache Merge Policies

## Requirement Specification

> The Apollo Client InMemoryCache SHALL define type policies to merge incoming paginated results for the subscriptions and feedArticles fields.

## Rationale

Without merge policies, Apollo Client overwrites the existing cached list with the newly fetched page, causing the UI list to replace its items rather than appending them.

## Acceptance Criteria

- The cache merges incoming `edges` arrays by appending them.
- The cache retains the latest `pageInfo` object.

## Verification Plan

- **Method**: Unit Test.
- **Procedure**: Test the cache read/write behaviors or mock Apollo queries in components and verify list growth.
