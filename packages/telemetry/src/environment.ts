/**
Cloudflare Workers environment binding for observability.

When `observability.enabled` is true in `wrangler.jsonc`, all
`console.*` calls (including those written to by Effect's default
`Logger.replace` and `Effect.log*`) are captured automatically by
Cloudflare Workers Logs and surfaced in the Workers dashboard.

No custom export layer is required: Workers Logs IS the observability
destination for this monorepo.
*/
export type CloudflareObservability = true;
