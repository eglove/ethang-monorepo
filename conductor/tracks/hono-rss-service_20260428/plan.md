# Implementation Plan: Hono RSS Service

## Phase 1: Project Setup & Database Schema
- [x] Task: Initialize Hono App and Drizzle/D1 4d41c0e
    - [ ] Create `apps/rss-hono` directory and initialize Hono project.
    - [ ] Configure `wrangler.jsonc` for D1 database and Cron Triggers.
    - [ ] Set up Drizzle ORM and configure `drizzle.config.ts`.
- [ ] Task: Define Database Schema
    - [ ] Write schema for `feeds` (id, url, name, description, icon).
    - [ ] Write schema for `articles` (id, feed_id, title, url, content, published_at).
    - [ ] Write schema for `user_subscriptions` (user_id, feed_id, category).
    - [ ] Write schema for `user_article_interactions` (user_id, article_id, is_read, is_saved).
    - [ ] Generate and apply initial database migrations.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Project Setup & Database Schema' (Protocol in workflow.md)

## Phase 2: Authentication & Core Utilities
- [ ] Task: Implement Authentication Middleware
    - [ ] Write failing test for authentication middleware ensuring it validates tokens from `auth.ethang.dev`.
    - [ ] Implement middleware logic to extract and verify the user.
    - [ ] Refactor and verify coverage.
- [ ] Task: Integrate `@ethang/store` for Business Logic
    - [ ] Write failing tests for `@ethang/store` classes handling Feed management, utilizing OOP and atomic updates.
    - [ ] Implement Core State Classes (e.g., `FeedStore`, `SubscriptionStore`).
    - [ ] Refactor and verify coverage.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Authentication & Core Utilities' (Protocol in workflow.md)

## Phase 3: RESTful API Endpoints
- [ ] Task: Feeds API
    - [ ] Write failing tests for Feed CRUD endpoints (`GET /feeds`, `POST /feeds`, `PUT /feeds/:id`, `DELETE /feeds/:id`).
    - [ ] Implement Feed endpoints integrating with `@ethang/store`.
    - [ ] Refactor and verify coverage.
- [ ] Task: Subscriptions API
    - [ ] Write failing tests for Subscription endpoints (subscribe, unsubscribe, update category).
    - [ ] Implement Subscription endpoints.
    - [ ] Refactor and verify coverage.
- [ ] Task: Articles Interaction API
    - [ ] Write failing tests for marking articles as read/unread and saved/starred.
    - [ ] Implement Article Interaction endpoints.
    - [ ] Refactor and verify coverage.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: RESTful API Endpoints' (Protocol in workflow.md)

## Phase 4: Background Fetching (Cron)
- [ ] Task: RSS Parser and Fetcher
    - [ ] Write failing tests for fetching and parsing RSS feed content (mocking external HTTP requests).
    - [ ] Implement fetch and parse logic.
    - [ ] Refactor and verify coverage.
- [ ] Task: Cron Worker Implementation
    - [ ] Write failing tests for cron handler triggering fetch and database updates.
    - [ ] Implement the Cloudflare Worker Cron handler.
    - [ ] Refactor and verify coverage.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Background Fetching (Cron)' (Protocol in workflow.md)