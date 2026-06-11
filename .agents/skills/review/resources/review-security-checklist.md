# Security Review Checklist

> Theory: SWEBOK v4 Ch 13 — CIA triad definitions, CERT Top 10, generic OWASP Top 10 descriptions, threat modeling procedure, CVSS gating thresholds, and secure SDLC. This skill contains only the React/Hono/Drizzle/Cloudflare specifics.

Structured checklist for the Security code review dimension.

## React-Specific

- [ ] No `dangerouslySetInnerHTML` with unsanitized user-controlled data — if required, input must be sanitized through an allowlisted HTML sanitizer (e.g. DOMPurify) with justification comment
- [ ] No dynamic JSX rendering from user-supplied strings without sanitization
- [ ] No template literal interpolation of user input into HTML strings
- [ ] Auth tokens stored in `httpOnly` cookies, NOT `localStorage` / `sessionStorage` (accessible to XSS)
- [ ] Sensitive data (tokens, PII) not stored in TanStack Query cache longer than the session requires — cache `staleTime` / `gcTime` appropriate to data sensitivity
- [ ] Client-side route guards are UX-only — server-side auth enforced in every Hono route; never rely on frontend guard alone
- [ ] No secrets (API keys, tokens, passwords) in React source, build-time environment variables exposed to the browser, or `vite.config` `define` blocks
- [ ] Third-party scripts loaded only from trusted origins; no dynamic `<script src>` from user input
- [ ] CSP-compatible: no inline `<script>` blocks, no `eval()`, no `new Function()`

## Hono / Cloudflare Worker-Specific

- [ ] All route path params, query params, and request body fields validated (type, range, length, encoding) via a schema validator (e.g. Zod) before use
- [ ] Authorization checked in every protected route — not just authentication; role/scope checked explicitly
- [ ] CORS configured restrictively — `origin` allowlist used; wildcard `*` only for fully public, unauthenticated resources
- [ ] Secrets read from `env` bindings (Cloudflare secrets/vars) — never hardcoded in worker source or `wrangler.jsonc` `vars` block (use `.dev.vars` for local, Cloudflare secret for production)
- [ ] Error responses do not leak stack traces, internal paths, SQL errors, or binding names in production — `app.onError` strips internal detail before responding
- [ ] Deserialization of untrusted input uses schema validation with allowlists, not denylists
- [ ] File upload endpoints (if any) validate type, size, and content — no path traversal in filenames
- [ ] Logging does not include sensitive data (passwords, tokens, PII, full payment card numbers)
- [ ] No open redirect — `Location` header values are not constructed from user-supplied input without strict allowlisting

## Drizzle-Specific

- [ ] No raw SQL strings built by string concatenation with user input — use Drizzle query builder methods or the `sql` tagged template with bound parameters only
- [ ] `sql` tagged template literals use only bound parameter placeholders for user data — no `sql`...```` interpolation of raw strings
- [ ] Schema migrations do not expose sensitive columns without access control at the API layer
- [ ] No unintended full-table reads — queries scoped to the authenticated user's data where applicable

## OWASP Top 10 — Stack-Specific Checks

Generic OWASP descriptions live in SWEBOK Ch 13. These are the stack checks per category.

| # | OWASP Category | Stack Check |
|---|----------------|-------------|
| A01 | Broken Access Control | Every Hono route has explicit auth + authz middleware. Default deny. Client-side guards are supplementary only. |
| A02 | Cryptographic Failures | No deprecated algorithms (MD5, SHA-1 for security). Secrets in Cloudflare secrets, not `wrangler.jsonc` `vars` or source. |
| A03 | Injection | React: no `dangerouslySetInnerHTML` with raw input. Hono/Drizzle: query builder or parameterized `sql` tag only — no string concatenation. |
| A04 | Insecure Design | Threat model run for new flows; security designed in, not bolted on. Auth checked at route level, not assumed from client state. |
| A05 | Security Misconfiguration | CORS restrictive; no default credentials; `wrangler.jsonc` compatibility flags reviewed; error handling configured to strip internals. |
| A06 | Vulnerable Components | New `npm` / `pnpm` dependencies checked against CVE databases. CVSS score assessed and gated before merge. |
| A07 | Identification & Auth Failures | Session management correct; `httpOnly` cookie storage; tokens not in URLs or query strings; no credential exposure in logs. |
| A08 | Software & Data Integrity Failures | CI pipeline integrity. No unsigned/unverified package installs from untrusted registries. |
| A09 | Logging & Monitoring Failures | Security events logged; PII and tokens not in log output; structured logging used so fields are explicit. |
| A10 | SSRF | Server-side `fetch` calls from Worker validate and restrict target URLs. No user-controlled redirect targets. |

## PII and Privacy

- [ ] Does this change handle PII (names, emails, addresses, account numbers, SSN, payment info)?
- [ ] If yes: data minimization applied — only collect/store/transmit what is necessary
- [ ] If yes: PII not logged, not cached in browser beyond session, not exposed in URLs or query strings