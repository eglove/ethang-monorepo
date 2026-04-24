# Technology Stack

## Core Languages
- **TypeScript:** The primary language used across the entire monorepo for strict typing and improved developer experience.

## Frontend
- **React:** The core library for building user interfaces (e.g., the dashboard application).
- **Tailwind CSS:** A utility-first CSS framework for rapid and consistent UI styling.

## Backend & API
- **Hono:** A small, simple, and ultrafast web framework used for backend services (`ethang-hono`, `sterett-hono`).
- **Cloudflare Workers:** The deployment target for all applications, including Hono services and frontend SPAs like Sanity Studio, via Wrangler.

## Database & Data Management
- **Drizzle ORM:** A headless TypeScript ORM used for database interactions.
- **Sanity CMS:** A headless CMS utilized for content management (e.g., `ethang-admin`, `sterett-admin`).

## Infrastructure & Tooling
- **pnpm:** The package manager handling monorepo workspaces and fast dependency installation.
- **Bun:** Utilized for fast script execution and development tasks.
- **Playwright & Vitest:** Testing frameworks for end-to-end and unit testing, respectively.
- **ESLint:** Shared linting configurations to maintain code quality.
