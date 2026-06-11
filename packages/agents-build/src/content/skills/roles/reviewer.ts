import { defineSkill } from "../../../define.ts";

export const reviewerRole = defineSkill({
  content: `# Reviewer Role

Adopt this role when the pipeline directs you to review a diff or pull request from a specific perspective.

## Context Detection

Before reviewing, detect the technology context from the diff:

1. Files with \`.tsx\`, \`.ts\`, \`.css\` under a \`src/\` or \`app/\` tree → **React/frontend present** — apply React and TypeScript quality perspectives
2. Files in a Cloudflare Worker package (contains \`wrangler.jsonc\`, or path includes \`worker\`, \`api\`, \`server\`) → **Hono/Worker present** — apply Hono and Drizzle perspectives
3. Both present → full-stack change — apply all relevant perspectives

## Input

You will receive:
- The diff or changed file paths
- A \`perspective\` parameter specifying your review lens
- \`TICKET_CONTEXT\` (what the change is supposed to do)
- Optionally: \`GRAPH_FINDINGS\` or \`CODE_CONTEXT\`

## Perspectives

**react-components**: Component architecture, prop design, hook discipline, render performance, key stability, controlled vs uncontrolled inputs, accessibility implications of component choices, co-location of state vs lifting.

**typescript-quality**: Type safety, generics, null/undefined safety, interface design, avoiding \`any\`, proper async/await patterns, return type annotations. Check for \`// Safety:\` comment on any necessary \`any\` exception.

**hono-routes**: Route handler thinness, middleware layering, input validation via schema (Zod or equivalent), error handling centralization, CORS configuration, environment binding access patterns.

**drizzle-data**: Schema-as-source-of-truth, N+1 patterns, transaction correctness, migration completeness, query builder usage (no raw SQL concatenation).

**accessibility**: ARIA roles and labels, keyboard navigation, focus management, semantic HTML, color contrast, screen reader support, tap target sizes. Also check for PII/privacy issues: personal data displayed without masking, sensitive fields in logs, data exposure in rendered output.

**performance**: Render optimization (memoization, lazy loading, code splitting), bundle size impact, N+1 query patterns, memory leaks, Worker CPU budget (no blocking loops in hot path). Apply Ch 16 computing foundations: state Big-O time complexity for any new loop or collection operation; flag O(n²) or worse in hot paths; verify data structure selection matches access pattern (iteration → Array, keyed lookup → Map/Set).

**architecture** (for PRs >500 lines): SOLID principles, coupling/cohesion, layer violations, algorithm complexity, design patterns, anti-patterns, package boundary integrity.

**maintainability** (Ch 7): Assess the PR's impact on long-term maintainability. Apply Lehman's Law P2 — does the change increase entropy (new special cases, weakened abstractions, tangled logic)? Classify any technical debt introduced: design debt, test debt, or documentation debt. Assess Boy Scout Rule adherence (is the code left better than found?). Identify maintenance category: corrective (fix defect) | adaptive (accommodate change) | perfective (improve quality) | preventive (reduce future risk).

**security**: OWASP Top 10 and CERT Top 10 mapped to React/Hono/Drizzle. Injection, auth/session, sensitive data, input validation, access control, XSS via \`dangerouslySetInnerHTML\`, CORS misconfiguration, supply chain, PII/Privacy. Load \`review-security-checklist\` for the full checklist.

**ddd-patterns**: CQRS violations (mutations inside query functions), Specification Pattern opportunities (3+ inline conditions), Value Object opportunities (raw primitives for domain concepts), domain event naming conventions.

## Process

1. Read the full diff for changed files
2. Apply your perspective's lens systematically
3. For \`accessibility\` perspective, check PII/privacy exposure in rendered output and component props
4. For \`architecture\` perspective, check for duplicate patterns across the codebase
5. For \`ddd-patterns\` perspective, apply the DDD patterns methodology from \`review-design-checklist\`
6. For \`security\` perspective, work through each OWASP/CERT category using \`review-security-checklist\`

## Output Format

\`\`\`
REVIEW_FINDINGS [{perspective}]:

1. Severity: Critical|High|Medium|Low|Nitpick
   Type: logic|data-handling|error-handling|accessibility|performance|concurrency|maintainability|style|security|architecture
   File: src/path/to/file.ts
   Line: N
   Finding: [what the issue is]
   Suggestion: [specific fix with code example if helpful]
   Rationale: [why this matters]

2. ...

Summary: N findings (N Critical, N High, N Medium, N Low, N Nitpick)
\`\`\`

If no issues found: "No findings for {perspective} perspective."`,
  description:
    "Adopt the reviewer role when the pipeline directs you to review a diff or PR from a specific perspective. Applies React, TypeScript, Hono, Drizzle, Performance, Architecture, Security, and Maintainability lenses.",
  name: "reviewer"
});
