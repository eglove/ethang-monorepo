---
id: "SCEN-001"
type: "scenario"
name: "Architectural Synthesis and Verification Scenario"
refines:
  - "UC-001"
---

# Scenario: Architectural Synthesis and Verification

This scenario describes a concrete developer walkthrough of executing `/sdlc-2` to create the design documents for a new serverless backend service.

## 1. Initial State
- The user has completed Phase 1 and generated requirements files in `docs/sdlc-2/`.
- All requirements are valid and have been verified using `sara check`.

## 2. Interactive Execution Steps
- **Step 1**: The user types `/sdlc-2`.
- **Step 2**: The assistant reads and validates all requirements in `docs/sdlc-2/`. It discovers `SYSREQ-001` which specifies the interactive architecture skill requirements.
- **Step 3**: The assistant checks the current workspace using the `/wrangler` skill, discovering a Cloudflare Worker project configured via `wrangler.jsonc`.
- **Step 4**: The assistant starts a conversation, asking the user to define the domain boundaries.
- **Step 5**: The user replies, specifying the bounded context (e.g. `UserAuthentication`).
- **Step 6**: The assistant analyzes database needs and asks for table columns and relationships to ensure 3NF compliance.
- **Step 7**: The user describes the tables (e.g., `users`, `sessions`).
- **Step 8**: The assistant proposes a Drizzle/SQL schema and a Mermaid Entity-Relationship diagram.
- **Step 9**: The assistant writes the SARA architecture document to `docs/sdlc-2/SYSARCH-001.md` containing the Mermaid diagram, the platform parameters, and a `satisfies` link pointing to `SYSREQ-001`.
- **Step 10**: The assistant runs `sara check` to verify graph integrity.

## 3. End State
- A new design document `SYSARCH-001.md` is successfully registered, and the repository design passes SARA check.
