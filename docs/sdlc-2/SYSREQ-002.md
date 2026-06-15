---
id: "SYSREQ-002"
type: "system_requirement"
name: "Monorepo Workspace & Service Inspection"
specification: "The system SHALL inspect active monorepo configurations, including the GraphQL supergraph schema, Drizzle database configs, and Cloudflare wrangler deployment profiles, to map the active service topology."
derives_from:
  - "SCEN-001"
---

# SYSREQ-002: Monorepo Workspace & Service Inspection

## 1. Description
The `/sdlc-2` skill must be context-aware. It should inspect the actual state of the codebase and active configurations rather than relying solely on user input.

## 2. Technical Details
- The skill must load and check Wrangler configurations (such as `wrangler.jsonc`, `wrangler.toml`, or Wrangler bindings).
- It must query the GraphQL gateway or federation schema definitions to map queries, mutations, and downstream microservices.
- It must locate database configurations (Drizzle configuration files, migrations directories) to understand which databases exist.
