# Just Another Monorepo

This monorepo contains a collection of web applications, libraries, and tools used for my personal and client projects.

## Key Projects

### Web Applications

- **ethang-astro**: Personal website/blog focused on technical web development content, built with Astro and Tailwind CSS, deployed to Cloudflare Pages.
- **dashboard**: Personal productivity dashboard with features for managing bookmarks, to-do lists, and job search tracking (with statistics and Q&A features), built with React and deployed to Cloudflare.
- **sterett-react**: Community organization/HOA website with content management through Sanity CMS, featuring news, events, galleries, and document management.
- **sterett-admin**: Administrative interface for the Sterett Creek Village Trustees, providing content management capabilities for the sterett-react website.
- **auth**: Authentication service for managing user accounts and access across applications, implemented as a Cloudflare Worker.
- **sanity-calendar-sync**: Utility application for synchronizing calendar events between Sanity CMS and external calendar services.
- **utility**: Published vitest report of multiple utility libraries.

### Libraries and Tools

- **toolbelt**: Comprehensive utility library with modules for collections, HTTP, functional programming, type checking, and more, shared across applications.
- **hooks**: Collection of reusable React hooks for UI interactions, state management, and browser APIs like local storage, clipboard, and media queries.
- **fetch**: Enhanced fetch API wrapper with caching and IndexedDB integration for offline support and improved data fetching.
- **eslint-config**: Shared ESLint configuration for multiple frameworks including React, Angular, Astro, and Solid, ensuring consistent code style.
- **markdown-generator**: Utility for programmatically generating structured markdown content for documentation and other text-based outputs.
- **project-builder**: Scaffolding tool for creating new projects with consistent structure and configuration based on templates.
- **leetcode**: Collection of LeetCode problem solutions and algorithms for educational purposes.
- **schemas**: Shared data schemas and validation utilities used across applications.
- **scripts**: Collection of utility scripts for development, deployment, and maintenance tasks.
- **store**: State management utilities and stores for frontend applications.
- **tsconfig**: Shared TypeScript configuration files for consistent TypeScript settings across projects.

### Templates

- **react-vite**: Template for quickly bootstrapping new React applications with Vite, Tailwind CSS, TypeScript, and Cloudflare deployment configuration.

## Technologies

- **Frontend**: React, Astro, TanStack (Query, Router, Table, Form), Tailwind CSS
- **Backend**: Node.js, Cloudflare Workers
- **Data**: Sanity CMS, IndexedDB
- **DevOps**: Automated testing, CI/CD pipelines, Cloudflare Pages deployment
- **Tools**: TypeScript, ESLint, Vite, pnpm workspaces
