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

This monorepo contains a collection of web applications, libraries, and tools used for personal and client projects. The vast majority of code is deployed to and runs on [Cloudflare Workers](https://workers.cloudflare.com/) (often bound to D1, KV, R2, or Queues), with a handful of React and Sanity Studio frontends and shared tooling.

## Key Projects

### Applications

- **[auth](apps/auth)**: Authentication service built on Cloudflare Workers with Hono, Drizzle ORM on D1, and `jose`/`bcryptjs` for JWT and password hashing.
- **[ethang-courses](apps/ethang-courses)**: Course tracking service implemented as a Cloudflare Workers RPC `WorkerEntrypoint` backed by Drizzle ORM on D1, reading content from the Sanity client.
- **[ethang-rss](apps/ethang-rss)**: RSS aggregator implemented as a Cloudflare Workers RPC `WorkerEntrypoint` that parses feeds with `fast-xml-parser` and persists data via Drizzle ORM on D1.
- **[modlist](apps/modlist)**: Cloudflare Workers RPC `WorkerEntrypoint` that manages game modification lists, mods, conflicts, patches, and requirements using Drizzle ORM on D1.
- **[sanity-calendar-sync](apps/sanity-calendar-sync)**: Cloudflare Worker that synchronizes Sanity CMS calendar entries into ICS via `ts-ics` and PortableText.
- **[sterett-admin](apps/sterett-admin)**: Sanity Studio v6 administrative interface for the Sterett Creek Village Trustees site.
- **[sterett-hono](apps/sterett-hono)**: Sterett Creek community web application rendered with Hono JSX, Tailwind CSS v4, PortableText, and a shared Workbox service worker on Cloudflare Workers.

### Packages

- **[eslint-config](packages/eslint-config)**: Shared ESLint configuration supporting React, Angular, Astro, Solid, TanStack Query/Router, Storybook, Playwright, Tailwind, and more.
- **[eslint-plugin](packages/eslint-plugin)**: Custom ESLint plugin encoding monorepo standards — 18 custom rules including `prefer-lodash`, `no-try-catch`, `no-barrel-files`, `chain-style`, `path-style`, `matches-shorthand`, `identity-shorthand`, `import-scope`, and auto-fixers for redundant explicit return types.
- **[markdown-generator](packages/markdown-generator)**: Programmatic GitHub-flavored markdown generator used by tooling.
- **[schemas](packages/schemas)**: Shared data schemas and validation utilities (Effect Schema) used across apps, including JWT helpers built on `jose`.
- **[scripts](packages/scripts)**: Collection of utility scripts for development, deployment, and maintenance tasks.
- **[store](packages/store)**: Fine-grained state management built on Immer (`Producer<T>`), Effect, `use-sync-external-store`, and lodash for the React frontends.
- **[tsconfig](packages/tsconfig)**: Shared TypeScript configuration presets (`@tsconfig/node-lts`, `@tsconfig/strictest`, `@tsconfig/vite-react`).

## Technologies

- **Frontend & UI**: React 19, Radix UI Themes, Radix Icons, lucide-react, styled-components, Tailwind CSS v4, PortableText for React, react-lite-youtube-embed, react-syntax-highlighter, tailwind-merge
- **Routing & State**: TanStack Router, TanStack Router Plugin, TanStack Query, RxJS, `@ethang/store` (Immer `Producer<T>` + Effect)
- **Backend & APIs**: Cloudflare Workers RPC (`WorkerEntrypoint`), Hono, Sanity client, `ts-ics`, `calendar-link`
- **Data & Databases**: Sanity CMS, Drizzle ORM on Cloudflare D1, `drizzle-kit`
- **Auth & Validation**: `jose` (JWT), `bcryptjs`, Effect Schema, `@hono/zod-validator`, `uuid`
- **Build & Tooling**: Vite 8, Bun, `@cloudflare/vite-plugin`, `@tanstack/router-plugin`, `@vitejs/plugin-react`, Wrangler, tsx, `@tailwindcss/vite`
- **Testing**: Vitest 4, `@vitest/coverage-v8`, Testing Library, jsdom, happy-dom, `@faker-js/faker`, Vitest UI, `@effect/vitest`
- **Code Quality**: TypeScript 6, ESLint 10, `@ethang/eslint-config`, `@ethang/eslint-plugin` (custom rules: `prefer-lodash`, `no-try-catch`, `no-barrel-files`, `chain-style`, `path-style`, shorthand variants), MegaLinter, SonarCloud, `typescript-eslint`
- **Functional & Utility**: Effect 3, lodash, Immer, `@total-typescript/ts-reset`
- **Workspace Management**: pnpm workspaces (Node `>=24`)

## Tooling & Quality Gates

- Continuous integration runs the `ci.yml` GitHub Actions workflow.
- MegaLinter and SonarCloud enforce style, security, and coverage gates (see badges above).
- All apps and packages target Node `>=24` and ESM.
