# Just Another Monorepo

[![CI](https://github.com/eglove/ethang-monorepo/actions/workflows/ci.yml/badge.svg)](https://github.com/eglove/ethang-monorepo/actions/workflows/ci.yml)
[![MegaLinter](https://img.shields.io/badge/MegaLinter-passing-success?logo=megalinter)](https://github.com/eglove/ethang-monorepo/actions/workflows/ci.yml)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=bugs)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=coverage)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)

This monorepo contains a collection of web applications, libraries, and tools used for personal and client projects.

## Key Projects

### Applications

- **[auth](apps/auth)**: Authentication service utilizing Cloudflare Workers, Hono, and Drizzle ORM.
- **[ethang-admin](apps/ethang-admin)**: Sanity Studio administrative interface for the ethang site content.
- **[ethang-courses](apps/ethang-courses)**: Course tracking service using Apollo GraphQL and Drizzle ORM on Cloudflare Workers.
- **[ethang-graphql](apps/ethang-graphql)**: Apollo Gateway / Supergraph service.
- **[ethang-react](apps/ethang-react)**: The main personal website front-end built with React, TanStack, Radix UI, Tailwind CSS, and Sanity.
- **[ethang-rss](apps/ethang-rss)**: RSS aggregator service with Apollo GraphQL and Drizzle.
- **[logger-service](apps/logger-service)**: Hono-based logging service deployed to Cloudflare Workers using Drizzle ORM.
- **[sanity-calendar-sync](apps/sanity-calendar-sync)**: Utility application for synchronizing calendar events between Sanity CMS and external calendar services.
- **[sterett-admin](apps/sterett-admin)**: Administrative interface for the Sterett Creek Village Trustees, providing content management capabilities for the sterett-hono website.
- **[sterett-hono](apps/sterett-hono)**: Sterett Creek community web application built with Hono and Tailwind CSS on Cloudflare Workers.

### Packages

- **[agents-build](packages/agents-build)**: Compiler package that generates Google Antigravity rules and skills into `.agents/` from TypeScript definitions.
- **[eslint-config](packages/eslint-config)**: Shared ESLint configuration for multiple frameworks including React, Angular, Astro, and Solid, ensuring consistent code style.
- **[graphql-types](packages/graphql-types)**: Shared TypeScript types for GraphQL schemas and operations generated via GraphQL Code Generator.
- **[hono-middleware](packages/hono-middleware)**: Shared middleware utilities for Hono applications.
- **[intl](packages/intl)**: Internationalization package providing locale-specific strings and translations for applications.
- **[leetcode](packages/leetcode)**: Collection of LeetCode solutions.
- **[logger-sdk](packages/logger-sdk)**: Client SDK for sending logs to the Hono-based logger service.
- **[markdown-generator](packages/markdown-generator)**: Utility for programmatically generating structured markdown content for documentation and other text-based outputs.
- **[schemas](packages/schemas)**: Shared data schemas and validation utilities used across applications.
- **[scripts](packages/scripts)**: Collection of utility scripts for development, deployment, and maintenance tasks.
- **[service-worker](packages/service-worker)**: Shared Workbox-based service worker configuration.
- **[store](packages/store)**: State management utilities and stores for frontend applications.
- **[toolbelt](packages/toolbelt)**: Comprehensive utility library with modules for collections, HTTP, functional programming, type checking, and more, shared across applications.
- **[tsconfig](packages/tsconfig)**: Shared TypeScript configuration files for consistent TypeScript settings across projects.

## Technologies

- **Frontend & UI**: React 19, Radix UI (Radix Themes), Styled Components, Tailwind CSS (v4)
- **State Management & Data Fetching**: TanStack Query (React Query), TanStack Router, Apollo Client, RxJS, `@ethang/store`
- **Backend & APIs**: Cloudflare Workers, Hono, Apollo GraphQL (Apollo Gateway / Supergraph, Apollo Server, Apollo Subgraph)
- **Data & Databases**: Sanity CMS, Drizzle ORM (SQLite / Cloudflare D1), IndexedDB
- **Validation**: Zod, `@hono/zod-validator`
- **Build & Tooling**: Vite, Bun, `@cloudflare/vite-plugin`, `@tanstack/router-plugin`, GraphQL Code Generator, Rover CLI
- **Testing**: Vitest, Playwright, Testing Library, `@axe-core/playwright`, Faker
- **Code Quality**: TypeScript (v6), ESLint, MegaLinter, SonarCloud, cspell
- **Workspace Management**: pnpm workspaces
