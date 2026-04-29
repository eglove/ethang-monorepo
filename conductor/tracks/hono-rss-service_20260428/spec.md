# Specification: Hono RSS Service

## Overview
Create a new Hono-based backend service for managing RSS feeds and user subscriptions. This service will act as a basic RESTful API deployed on Cloudflare Workers, utilizing Drizzle ORM and a Cloudflare D1 (SQLite) database. User authentication will be integrated with the existing authentication service (`auth.ethang.dev`). The service will also include background workers for periodic fetching of feed updates.

## Functional Requirements
- **Feed Management (CRUD):**
  - Create, Read, Update, and Delete RSS feeds.
  - Required fields for feeds: URL, Name/Title, Description, Icon/Logo URL.
- **User Subscriptions:**
  - Users can subscribe to and unsubscribe from feeds.
  - Track user-specific data:
    - Read/Unread status for individual articles.
    - User-defined Categories/Folders for organizing subscriptions.
    - Saved/Starred status for specific articles.
- **Background Fetching:**
  - Implement a Cloudflare Worker Cron Trigger to periodically fetch and parse the contents of tracked RSS feeds and update the database with new articles.
- **Authentication:**
  - All protected endpoints must verify user identity using the existing `auth.ethang.dev` service.

## Non-Functional Requirements
- **Tech Stack:**
  - Framework: Hono
  - Runtime: Cloudflare Workers
  - Database: Cloudflare D1 (SQLite) via Wrangler
  - ORM: Drizzle ORM
  - State Management / Logic: `@ethang/store` classes for OOP logic, atomic updates, and subscriptions.
  - Utilities: Lodash, Zod (for validation as per project guidelines)
- **Architecture:**
  - RESTful API design.

## Acceptance Criteria
- [ ] Users can successfully add, remove, and view RSS feeds.
- [ ] Users can subscribe to feeds and organize them into categories.
- [ ] The background job runs on a schedule and successfully retrieves new articles for all feeds.
- [ ] Users can mark articles as read/unread and saved/starred.
- [ ] API endpoints are protected and correctly validate tokens from `auth.ethang.dev`.
- [ ] All database interactions use Drizzle ORM with the configured D1 database.
- [ ] Domain logic uses `@ethang/store`.

## Out of Scope
- A dedicated frontend user interface (this is strictly a backend service/API).