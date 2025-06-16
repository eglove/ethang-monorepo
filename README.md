# Just Another Monorepo

This monorepo contains a collection of web applications, libraries, and tools used for my personal and client projects.

## Key Projects

### Applications

- **dashboard**: Personal productivity dashboard with features for managing bookmarks, to-do lists, and job search tracking (with statistics and Q&A features), built with React and deployed to Cloudflare.
- **ethang**: Personal website.
- **sanity-calendar-sync**: Utility application for synchronizing calendar events between Sanity CMS and external calendar services.
- **sterett-admin**: Administrative interface for the Sterett Creek Village Trustees, providing content management capabilities for the sterett-react website.
- **sterett-react**: Community organization/HOA website with content management through Sanity CMS, featuring news, events, galleries, and document management.

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

- **Frontend**: React, Astro, TanStack (Query, Router, Table, Form), Tailwind CSS
- **Backend**: Node.js, Cloudflare Workers
- **Data**: Sanity CMS, IndexedDB
- **DevOps**: Automated testing, CI/CD pipelines, Cloudflare Pages deployment
- **Tools**: TypeScript, ESLint, Vite, pnpm workspaces
