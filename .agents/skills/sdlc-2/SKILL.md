---
description: Interactive architecture and design interview to translate requirements into SARA-compliant design documents with Mermaid diagrams.
name: sdlc-2
---

# Standalone SDLC Phase 2 (sdlc-2) - Architecture & Design Director

This skill acts as a software architecture and design director/griller. It conducts a structured, interactive user interview (similar to the `/grill-me` flow) to translate Phase 1 requirements into system designs. Once completed, it generates structured SARA-compliant Markdown documents and validates their relationship integrity.

---

## Phase 2 Reference & Alignment
This skill aligns with the following Phase 2 guidelines:
- [ddd-strategic](file:///.agents/rules/ddd-strategic.md) - Bounded contexts, context boundaries, and ubiquitous language.
- [ddd-tactical](file:///.agents/rules/ddd-tactical.md) - CQRS patterns, Specifications, Value Objects, and Domain Events.
- [atomic-design](file:///.agents/rules/atomic-design.md) - Modularity rules for React components and Hono/Cloudflare Worker routes.
- [architectural-documentation](file:///.agents/rules/architectural-documentation.md) - Descriptions, viewpoints, and notations (e.g. C4 model).
- [architectural-synthesis](file:///.agents/rules/architectural-synthesis.md) - ASRs, architectural patterns, and ADD.
- [architectural-evaluation](file:///.agents/rules/architectural-evaluation.md) - Evaluating architectures via ATAM, design trade-offs, and quality attributes.
- [architectural-tactics](file:///.agents/rules/architectural-tactics.md) - Tactics for availability, performance, and security.
- [conways-law](file:///.agents/rules/conways-law.md) - Organization structures and boundaries.
- [coupling-and-cohesion](file:///.agents/rules/coupling-and-cohesion.md) - Separation of concerns and dependency direction.
- [information-hiding](file:///.agents/rules/information-hiding.md) - Encapsulation, API design, and public interfaces.
- [interface-control](file:///.agents/rules/interface-control.md) - API stability and inter-module isolation.
- [database-normalization](file:///.agents/rules/database-normalization.md) - Relational schema design (3NF, constraints, and indexes).
- [security-by-design](file:///.agents/rules/security-by-design.md) - OWASP Top 10, CIA Triad, STRIDE threat modeling.
- [internationalization-strings](file:///.agents/rules/internationalization-strings.md) - String isolation and locale management.
- [design-quality-reviews](file:///.agents/rules/design-quality-reviews.md) - SDD sufficiency, quality reviews, and design audits.
- [design-completeness](file:///.agents/rules/design-completeness.md) - Requirements mapping and state space coverage.
- [quality-assurance-reviews](file:///.agents/rules/quality-assurance-reviews.md) - Peer design reviews, inspections, and checklists.

---

## Step-by-Step Execution Plan

### Step 1: Ingest Phase 1 Requirements
1. Locate SARA requirements documents under `docs/<feature-name>/`.
2. Inspect the SARA graph using `sara check` to verify it is valid.
3. If requirements are missing, incomplete, or violate SARA schema, immediately escalate to the user and pause.

### Step 2: System and Monorepo Context Inspection
1. Inspect monorepo workspace configuration using the `/wrangler` skill, Drizzle configuration, and the GraphQL schema/supergraph.
2. Determine active services, databases, and dependencies.

### Step 3: Interactive Architecture Design Interview
Conduct a structured, interactive interview (one/two questions per turn) to cover:
1. **Strategic & Tactical Domain-Driven Design (DDD)**: Identify bounded contexts and context boundary crossings. Define Value Objects, CQRS separation, and Domain Events.
2. **Database Normalization & Storage Design**: Define relational schemas, tables, fields, constraints, and indexes (conforming to 3NF).
3. **Mermaid Diagrams**: Draft Mermaid syntax for:
   - System C4 Architecture (Components, Containers, External Integrations).
   - Relational Database Schemas (ER diagrams).
4. **Architectural Tactics & Security**: Define mechanisms for performance SLAs, caching, database indexing, availability (replication, failover), and security (OWASP defenses, TLS, input sanitization).

### Step 4: Write SARA-Compliant Design Documents
Write the architecture and design specifications as SARA-compatible Markdown files under `docs/<feature-name>/`.
- Use type `system_architecture` or `software_detailed_design`.
- Ensure files contain correct YAML frontmatter and link back to requirements using `satisfies`.
- Include the generated Mermaid diagrams directly.

### Step 5: Validate and Verify Design Graph
1. Run `sara check` to verify the integrated requirements and design graph.
2. Ensure there are no broken links, loops, or orphaned design elements.
