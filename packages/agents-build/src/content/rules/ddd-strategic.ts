import { defineRule } from "../../define.ts";

export const dddStrategic = defineRule({
  content: `# DDD Strategic Design

## 1. Domain Theory and Conceptual Foundations
Domain-Driven Design (DDD), originally formulated by Eric Evans, is an approach to software development for complex needs, connecting the implementation to an evolving model of core business concepts. As discussed in SWEBOK v4 Chapter 2 (Software Architecture) and Chapter 3 (Software Design), managing structural complexity is a primary challenge of software engineering. DDD strategic design provides the tools to partition the enterprise domain space into manageable, decoupled subdomains, ensuring that the software remains maintainable and aligned with business goals as it scales.

Strategic design centers on the following key concepts:
- **Domain**: The overall sphere of activity and knowledge centered around the business enterprise.
- **Subdomain**: A distinct part of the domain. Subdomains are classified as:
  - *Core Domain*: The primary competitive advantage of the organization. This is where engineering investment must be focused.
  - *Supporting Domain*: Custom software that is necessary for the core domain but does not provide a competitive edge.
  - *Generic Domain*: Standard industry problems that can be solved with off-the-shelf software or libraries (e.g., authentication, logging).
- **Domain Model**: An abstraction of the domain that captures the essential concepts, rules, and behaviors required to solve business problems.

### 1.1 Bounded Contexts and Modularity
A bounded context is the boundary within which a particular domain model is defined and applicable. SWEBOK v4 Chapter 3 stresses modularity as a key design principle. In a monolithic or poorly partitioned codebase, a single term like "Account" or "Product" can accumulate dozens of unrelated properties to satisfy different business units, leading to high cognitive complexity and fragile dependencies.

Within a bounded context, every term in the model has a single, unambiguous meaning. The billing context defines an "Account" in terms of ledgers, balances, and invoices, while the identity context defines it in terms of credentials, active sessions, and multi-factor settings. By establishing strict boundaries, developers can implement targeted, highly cohesive models that are insulated from changes in external sub-systems.

Modularity is also crucial for parallel team execution. In large projects, multiple developers or sub-teams must work on separate features concurrently. Bounded contexts establish clear architectural boundaries that map directly to team ownership boundaries. This alignment, which relates to Conway's Law, ensures that changes to the core payments system do not block or break the concurrent development of the user notifications engine.

### 1.2 Ubiquitous Language and Semantic Drift
A Ubiquitous Language is a shared, unambiguous vocabulary co-created by domain experts and developers. It is used consistently in verbal communication, product requirements, variable names, database tables, and automated tests. Establishing a Ubiquitous Language prevents semantic drift—the gradual divergence of vocabulary between business prose and software implementation. If a requirement refers to "suspending a subscription," but the codebase implements this as a \`deleteUser\` query, semantic drift occurs. This leads to developers making incorrect architectural assumptions and business analysts writing untestable specifications.

When establishing a Ubiquitous Language, developers must audit their code comments, database tables, and API endpoints. The glossary must be treated as a living specification. If the business changes a definition—for example, redefining a "trial user" as a "freemium account"—the software model, database records, and API routes must be refactored concurrently to reflect this shift, ensuring the codebase continues to mirror reality.

### 1.3 Context Mapping and Integration Patterns
A Context Map defines the relationships and data flows between bounded contexts. SWEBOK v4 Chapter 2 details the necessity of interface control and architectural boundaries. DDD defines several relationship patterns:
1. **Shared Kernel**: A shared subset of the model and database tables. Changes require coordination across teams.
2. **Customer-Supplier / Upstream-Downstream**: The upstream context delivers data to the downstream context. The downstream team's success depends on the upstream team's delivery.
3. **Conformist**: The downstream context conforms completely to the upstream domain model, accepting its vocabulary and structure.
4. **Anticorruption Layer (ACL)**: A translation layer implemented in the downstream context that maps upstream models into the downstream Ubiquitous Language, preventing external schemas from polluting local models.
5. **Separate Ways**: Decoupling contexts completely to allow teams to develop independently without integration overhead.

## 2. Standard Operating Procedures (SOP)
The agent must execute the following procedures during requirements analysis and planning:

### Step 2.1: Domain Analysis & Subdomain Classification
Prior to implementation, analyze the task requirements and classify the scope into Core, Supporting, or Generic domains. Document this classification in the implementation plan to justify the engineering effort allocation.

### Step 2.2: Bounded Context Verification
Map the target changes to specific codebase boundaries. In this monorepo, verify boundaries using the following codebase proxies:
- **Package boundaries**: Review \`package.json\` dependencies across \`packages/\`.
- **Hono route groups**: Identify sub-routers (e.g. \`app.route("/payments", paymentsRouter)\`).
- **Drizzle schema modules**: Locate the schema file (e.g. \`packages/db/schema/payments.ts\`).
- **TanStack query keys**: Check the query namespace hierarchy (e.g. \`["payments", "list"]\`).
- **Feature folders**: Verify path co-location (e.g. \`src/features/payments/\`).

Flag any task that requires modifying code in multiple contexts as a "Context Boundary Crossing" and document the integration risks.

### Step 2.3: Ubiquitous Language Alignment Check
Verify that the terminology in the task description matches the codebase. If a requirement introduces new concepts (e.g., "customer grace period"), create a Ubiquitous Language Glossary in the implementation plan mapping these prose terms to system identifiers (variables, database fields, API parameters).

### Step 2.4: Implementing an Anticorruption Layer (ACL)
When importing data or invoking APIs from an external context, wrap the interaction in an Anticorruption Layer. Here is an example of an ACL class that translates external data into local domain types. Note the use of arrow functions, explicit member accessibility, bracket notation for index signature property access, and the absence of explicit return types:

\`\`\`typescript
export type ExternalClient = {
  client_id: string;
  auth_token_val: string;
  is_active_flag: number;
};

export type LocalUser = {
  id: string;
  token: string;
  isActive: boolean;
};

export class ClientTranslator {
  private namespace: string;

  public constructor(namespace: string) {
    this.namespace = namespace;
  }

  public translate = (external: Record<string, any>) => {
    const rawId = external["client_id"];
    const rawToken = external["auth_token_val"];
    const rawFlag = external["is_active_flag"];

    return {
      id: \`\${this.namespace}_\${String(rawId)}\`,
      isActive: rawFlag === 1,
      token: String(rawToken),
    };
  };
}
\`\`\`

### Step 2.5: Generating the DDD Analysis Markdown Output
Every requirements analysis and implementation plan must conclude with a completed DDD Analysis block. The format must be exactly as follows:

\`\`\`markdown
## DDD Analysis
Bounded context: [name — e.g., "payments"]
Cross-context: yes | no — [if yes: which contexts, what the coupling risk is]
Ubiquitous language delta: [task terms not matched in code vocabulary, or "None"]
Domain events: [past-tense event names this feature produces or consumes, or "None identified"]
\`\`\`

## 3. Agent Compliance Checklist
The agent must verify compliance with the following strategic design rules:

- [ ] **Context Identification**: Has the target bounded context been explicitly named in the DDD Analysis block?
- [ ] **Subdomain Classification**: Has the feature been classified as Core, Supporting, or Generic?
- [ ] **Boundary Verification**: Did you verify the context boundary using Hono, Drizzle, and package configurations?
- [ ] **Boundary Crossings Flagged**: Were all modifications crossing context boundaries documented and analyzed for coupling risk?
- [ ] **Ubiquitous Language Glossary**: Is there a glossary mapping user request terms to the codebase vocabulary?
- [ ] **No Vocabulary Mismatch**: Have all naming mismatches (e.g., "customer" vs "user") been resolved before writing code?
- [ ] **Anticorruption Layer Used**: Are all external API calls or foreign database references insulated with an ACL?
- [ ] **Local Model Insulation**: Did you ensure that foreign schemas and third-party types do not bleed into local components?
- [ ] **Shared Kernel Audited**: Are any shared tables or libraries documented and approved to prevent schema drift?
- [ ] **No Generic Bleed**: Have generic domains (e.g., auth, logging) been kept separate from the core business logic?
- [ ] **DDD Analysis Block Present**: Is the formal DDD Analysis markdown block present in the final implementation plan?
- [ ] **Past-Tense Domain Events**: Are all domain events identified in the plan named using past-tense verbs (e.g., "PaymentProcessed")?
- [ ] **No Forbidden Terminology**: Has the code and documentation been audited to ensure no banned words are present?
- [ ] **Explicit Member Modifiers**: Do all classes in the codebase use explicit public/private modifiers for members?
- [ ] **Arrow Functions Enforced**: Are all functions and callback handlers in the design written as arrow functions?
- [ ] **No Explicit Return Types**: Have explicit return types been omitted from the TS code blocks?
- [ ] **Bracket Notation Access**: Are index-signature object properties accessed using bracket notation?
- [ ] **Clean Compilation**: Does the project build successfully without any linting or compilation errors?`,
  description:
    "Identifies bounded contexts via package boundaries, Hono route groups, Drizzle schema modules, and TanStack query-key namespaces; extracts the ubiquitous language delta; detects context boundary crossings. Use during requirements analysis and planning to produce a DDD Analysis block.",
  filename: "ddd-strategic",
  trigger: "model_decision"
});
