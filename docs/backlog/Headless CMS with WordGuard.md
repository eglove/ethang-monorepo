---
tags: [backlog, cms, headless, wordguard]
status: todo
priority: low
created: 2026-07-26
---

# Headless CMS with WordGuard

## Goal

Build a headless CMS where users manage their own content with file/image uploads, embeds, and rich-text editing powered by [WordGuard](https://wordgard.net/).

## Core Features

### Multi-Tenant Data
- Each user has their own data namespace
- Users manage their own content types/schemas

### Asset Management
- File uploads (images, PDFs, etc.)
- Image optimization and resizing
- Embed support (YouTube, Twitter, etc.)

### Rich-Text Editing
- WordGuard as the rich-text engine
- Custom blocks and embeds
- Real-time collaboration? (future)

### API
- REST or GraphQL API for content delivery
- Webhooks for content changes
- SDK for client consumption

## Plan

1. **Research WordGuard**: API, pricing, self-hosting options, integration patterns
2. **Data model**: Users, workspaces, content types, entries, assets
3. **Auth**: Multi-tenant auth — users scoped to their own data
4. **File storage**: R2 or similar for uploads
5. **API design**: CRUD for content types and entries
6. **Rich-text integration**: WordGuard editor with custom blocks
7. **Asset pipeline**: Upload → optimize → serve
8. **SDK/Client**: TypeScript SDK for consuming the API

## Open Questions

- Self-hosted WordGuard or SaaS?
- Database: D1, Postgres, or something else?
- File storage: R2, S3, or something else?
- Authentication: existing auth system or new?
- Is this a standalone app or within the monorepo?

## Tech Stack (proposed)

- Hono or TanStack Start for API
- D1 or Postgres
- R2 for file storage
- WordGuard for rich-text
- Existing monorepo auth system

## Related

- [[Frontend Migration to TanStack Start-Astryx]] (if API uses TanStack Start)
