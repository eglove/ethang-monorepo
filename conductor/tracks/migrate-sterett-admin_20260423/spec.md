# Specification: Migrate sterett-admin to Cloudflare Workers

## Overview
Migrate the `sterett-admin` Sanity Studio application from Cloudflare Pages to Cloudflare Workers using the Workers Static Assets feature. This replaces the automatic GitHub repository deployment with manual CLI deployments via a `deploy` script in `package.json`.

## Functional Requirements
- **Wrangler Configuration:** Create a `wrangler.jsonc` file in `apps/sterett-admin` to configure the application as a Cloudflare Worker.
- **Static Assets:** Configure the Worker to serve static assets from the Sanity build output directory (`dist`).
- **Custom Domain:** Configure the deployment to use the custom route/domain `admin.sterettcreekvillagetrustee.com`.
- **SPA Routing:** Ensure SPA (Single Page Application) routing fallback is implemented so deep links in the Sanity Studio resolve correctly to `index.html`.
- **Deploy Script:** Add a `deploy` script to `apps/sterett-admin/package.json` (e.g., `pnpm build && wrangler deploy`).

## Acceptance Criteria
- `sterett-admin` deploys successfully to a Cloudflare Worker via the `pnpm run deploy` command.
- The studio is fully functional and accessible at `https://admin.sterettcreekvillagetrustee.com/`.
- Direct navigation to deep links (e.g., `/structure/some-document`) does not result in a 404 error.
- Cloudflare Pages automatic GitHub deployment is no longer required or utilized for this application.