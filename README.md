# Just Another Monorepo

![CI](https://github.com/eglove/ethang-monorepo/actions/workflows/ci.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=coverage)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=bugs)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=eglove_ethang-monorepo&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=eglove_ethang-monorepo)
[![MegaLinter](https://img.shields.io/badge/MegaLinter-passing-success?logo=megalinter)](https://github.com/eglove/ethang-monorepo/actions/workflows/ci.yml)

This monorepo contains a collection of web applications, libraries, and tools used for my personal and client projects.

## Key Projects

### Applications

- **dashboard**: Personal productivity dashboard with features for managing bookmarks, to-do lists, and job search tracking (with statistics and Q&A features), built with React and deployed to Cloudflare.
- **ethang**: Personal website.
- **auth**: Authentication service used for my own projects.
- **sanity-calendar-sync**: Utility application for synchronizing calendar events between Sanity CMS and external calendar services.
- **sterett-admin**: Administrative interface for the Sterett Creek Village Trustees, providing content management capabilities for the sterett-react website.
- **sterett-client**: Community organization/HOA website with content management through Sanity CMS, featuring news, events, galleries, and document management.

### Packages

- **eslint-config**: Shared ESLint configuration for multiple frameworks including React, Angular, Astro, and Solid, ensuring consistent code style.
- **fetch**: Enhanced fetch API wrapper with caching and IndexedDB integration for offline support and improved data fetching.
- **hooks**: Collection of reusable React hooks for UI interactions, state management, and browser APIs like local storage, clipboard, and media queries.
- **markdown-generators**: Utility for programmatically generating structured markdown content for documentation and other text-based outputs.
- **project-builder**: Scaffolding tool for creating new projects with consistent structure and configuration based on templates.
- **schemas**: Shared data schemas and validation utilities used across applications.
- **scripts**: Collection of utility scripts for development, deployment, and maintenance tasks.
- **store**: State management utilities and stores for frontend applications.
- **toolbelt**: Comprehensive utility library with modules for collections, HTTP, functional programming, type checking, and more, shared across applications.
- **tsconfig**: Shared TypeScript configuration files for consistent TypeScript settings across projects.

## Technologies

- **Frontend**: React, TanStack (Query, Router, Table, Form), Tailwind CSS
- **Backend**: Cloudflare Workers
- **Data**: Sanity CMS, IndexedDB
- **DevOps**: Automated testing, CI/CD pipelines, Wrangler deployment
- **Tools**: TypeScript, ESLint, Vite, pnpm workspaces
