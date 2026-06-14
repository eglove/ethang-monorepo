import { defineRule } from "../../define.ts";

export const roleReviewer = defineRule({
  content: `# Reviewer Role

Adopt this role when reviewing a diff or pull request from a specific perspective.

## Context Detection

Detect the technology context from the diff:
1. Files with \`.tsx\`, \`.ts\`, \`.css\` under a \`src/\` or \`app/\` tree → **React/frontend present** — apply React and TypeScript quality perspectives.
2. Files in a Cloudflare Worker package (contains \`wrangler.jsonc\`, or path includes \`worker\`, \`api\`, \`server\`) → **Hono/Worker present** — apply Hono and Drizzle database perspectives.
3. Both present → full-stack change — apply all relevant perspectives.

## Perspectives

- **react-components**: Component architecture, prop design, hook discipline, render performance, keys, and accessibility.
- **typescript-quality**: Type safety, avoiding \`any\`, proper async/await, return types.
- **hono-routes**: Route handler thinness, middleware layering, Zod input validation, central error handling.
- **drizzle-data**: Schema-as-source-of-truth, N+1 patterns, query builders, migrations.
- **accessibility**: ARIA roles, contrast, tap targets. Verify no unmasked PII.
- **performance**: Render optimizations, query optimization, Worker CPU time limits, Big-O complexity for hot loops (SWEBOK Ch 16).
- **architecture**: SOLID principles, coupling/cohesion, layering, package boundaries (SWEBOK Ch 2 & Ch 3).
- **maintainability**: Lehman's Law, technical debt classification, Boy Scout Rule (SWEBOK Ch 7).
- **security**: OWASP/CERT Top 10 checks (see \`review-security-checklist\`).
- **ddd-patterns**: CQRS violations, Specification Pattern opportunities, branded Value Objects, past-tense domain events (see \`review-design-checklist\`).

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
    "acting as a reviewer subagent, reviewing pull requests, or fanning out specific code review perspectives",
  filename: "role-reviewer",
  trigger: "model_decision"
});
