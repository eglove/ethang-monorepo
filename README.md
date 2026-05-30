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

This monorepo contains a collection of web applications, libraries, and tools used for my personal and client projects.

## Key Projects

### Applications

- **auth**: Authentication service utilizing Cloudflare Workers, Hono, and Drizzle ORM.
- **ethang-admin**: Sanity Studio administrative interface for the ethang site content.
- **ethang-courses**: Course tracking service using Apollo GraphQL and Drizzle ORM on Cloudflare Workers.
- **ethang-graphql**: Apollo Gateway / Supergraph service.
- **ethang-hono**: The ethang web application built with Hono, Tailwind, and Sanity.
- **ethang-rss**: RSS aggregator service with Apollo GraphQL and Drizzle.
- **sanity-calendar-sync**: Utility application for synchronizing calendar events between Sanity CMS and external calendar services.
- **sterett-admin**: Administrative interface for the Sterett Creek Village Trustees, providing content management capabilities for the sterett-react website.
- **sterett-hono**: Sterett Creek community web application built with Hono.

### Packages

- **eslint-config**: Shared ESLint configuration for multiple frameworks including React, Angular, Astro, and Solid, ensuring consistent code style.
- **hono-middleware**: Shared middleware utilities for Hono applications.
- **hooks**: Collection of reusable React hooks for UI interactions, state management, and browser APIs like local storage, clipboard, and media queries.
- **leetcode**: Collection of LeetCode solutions.
- **markdown-generator**: Utility for programmatically generating structured markdown content for documentation and other text-based outputs.
- **project-builder**: Scaffolding tool for creating new projects with consistent structure and configuration based on templates.
- **schemas**: Shared data schemas and validation utilities used across applications.
- **scripts**: Collection of utility scripts for development, deployment, and maintenance tasks.
- **service-worker**: Shared Workbox-based service worker configuration.
- **store**: State management utilities and stores for frontend applications.
- **toolbelt**: Comprehensive utility library with modules for collections, HTTP, functional programming, type checking, and more, shared across applications.
- **tsconfig**: Shared TypeScript configuration files for consistent TypeScript settings across projects.

## Technologies

- **Frontend**: React, TanStack (Query, Router, Table, Form), Tailwind CSS
- **Backend**: Cloudflare Workers, Hono, Apollo GraphQL
- **Data**: Sanity CMS, IndexedDB, Drizzle ORM
- **DevOps**: Automated testing, CI/CD pipelines, Wrangler deployment
- **Tools**: TypeScript, ESLint, Vite, pnpm workspaces
