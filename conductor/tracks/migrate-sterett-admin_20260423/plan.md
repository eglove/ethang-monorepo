# Implementation Plan: Migrate sterett-admin to Cloudflare Workers

## Phase 1: Configuration
- [ ] Task: Create `wrangler.jsonc` for `sterett-admin`
    - [ ] Create `apps/sterett-admin/wrangler.jsonc`.
    - [ ] Configure basic settings: `name`, `main` (if required), and `compatibility_date`.
    - [ ] Configure Workers Static Assets to serve the `dist` directory (`assets = { directory: "./dist" }`).
    - [ ] Configure the custom domain route for `admin.sterettcreekvillagetrustee.com` (using `routes` and `custom_domain: true`).
- [ ] Task: Update `package.json`
    - [ ] Add a `deploy` script to `apps/sterett-admin/package.json` that builds the Sanity studio and runs `wrangler deploy` (e.g., `"deploy": "pnpm build && wrangler deploy"`).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Configuration' (Protocol in workflow.md)