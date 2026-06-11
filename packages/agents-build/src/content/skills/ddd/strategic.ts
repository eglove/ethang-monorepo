import { defineSkill } from "../../../define.ts";

export const dddStrategicSkill = defineSkill({
  content: `# DDD Strategic Lens

> Theory: read \`resources/ch03-design.md\` in the \`swebok\` skill for bounded-context,
> ubiquitous-language, and domain-event definitions and rationale (max 3 chapters per task).
> This skill contains only the stack-specific specifics.

Apply this lens during requirements analysis and planning. The goal is not to refactor everything into
DDD — the goal is to reason about the domain clearly.

---

## Identifying Bounded Contexts

Use these codebase proxies to locate context boundaries:

- **Package boundaries** — each app or library under \`packages/\` is a candidate context
- **Hono route groups** — each mounted sub-router (\`app.route("/accounts", accounts)\`, \`app.route("/billing", billing)\`) follows a context line
- **Drizzle schema modules** — a group of related tables defined together in one schema file maps to a context
- **TanStack query-key namespaces** — the first segment of a query key (\`["payments", ...]\`, \`["billing", ...]\`) typically names a context
- **Feature folders** — \`src/features/payments/\`, \`src/features/billing/\` map to contexts

A change that modifies files in two or more of these groups **crosses a context boundary** — flag this
as a coupling risk in the analysis.

---

## Extracting Ubiquitous Language

1. Pull domain terms from the task: prose wording, feature names, button labels, field names
2. Compare against code vocabulary: React component names, Hono handler names, Drizzle table/column
   names, query-key segments, API route paths
3. Flag mismatches — these are where the most confusion and defects hide

**Common mismatches to watch for:**

| Task says | Code often says | Risk |
|---|---|---|
| "customer" | "user" / "account" | Ambiguous — is it a person or an account? |
| "payment method" | "stored payment" / "gatewayRef" | Gateway jargon leaking into domain language |
| "enroll" | "set up" / "configure" | Enrollment is a domain event; setup is a UI action |
| "cancel" | "delete" / "remove" | Cancel implies reversibility; delete may not |
| "service" | "product" / "offering" | Conflation of what is sold vs what is delivered |

Record the delta in output — even "None" is a useful finding.

---

## Classifying Operations as Domain Events

1. List every state-changing operation the task's feature produces or consumes (Hono POST/PUT/DELETE
   handlers, Drizzle writes, TanStack mutations)
2. Classify each: domain event (past tense), command (imperative), or query (noun phrase)
3. If a read is implemented as a mutation/POST instead of a GET + TanStack query → CQRS violation
   (flag in review)
4. Recommend past-tense names for new domain events

| Type | Naming | Example |
|---|---|---|
| **Domain Event** | Past tense | \`PaymentSubmitted\`, \`AccountEnrolled\`, \`ServiceDisconnected\` |
| **Command** | Imperative | \`submitPayment\`, \`enrollAccount\`, \`disconnectService\` |
| **Query** | Noun phrase | \`getPaymentMethods\`, \`listBillingHistory\` |

---

## Spotting Context Boundary Crossings

A change crosses a bounded context boundary when it:
- Writes to tables owned by two different contexts inside one Drizzle transaction or one Hono handler
- Imports a type from another context's feature folder directly (instead of through a shared interface)
- Adds a column to one context's table to serve a different context's UI need
- Mounts or imports a component from context A inside a feature module of context B

**How to detect:** grep the changed handler/module for cross-feature imports and for writes that span
more than one schema module. Cross-context coupling is not always wrong — but it must be explicit and
intentional. Flag it so the engineer can decide, not discover it in production.

---

## Output Section

Add this block to every requirements analysis output:

\`\`\`
## DDD Analysis
Bounded context: [name — e.g., "payments"]
Cross-context: yes | no — [if yes: which contexts, what the coupling risk is]
Ubiquitous language delta: [task terms not matched in code vocabulary, or "None"]
Domain events: [past-tense event names this feature produces or consumes, or "None identified"]
\`\`\``,
  description:
    "Identifies bounded contexts via package boundaries, Hono route groups, Drizzle schema modules, and TanStack query-key namespaces; extracts the ubiquitous language delta; detects context boundary crossings. Use during requirements analysis and planning to produce a DDD Analysis block.",
  name: "ddd-strategic"
});
