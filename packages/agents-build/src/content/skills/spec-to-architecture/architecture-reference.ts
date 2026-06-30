import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const architectureReference: MarkdownBlock[] = [
  {
    level: 1,
    text: "C4 Model Architecture Design Guidelines",
    type: "header"
  },
  {
    text: "The C4 Model provides a hierarchical decomposition of a software system into System Context, Container, Component, and Code views. This skill generates architecture designs at the SWEBOK v4 Chapter 2/3 level (architecture design stage per Bass/Clements/Kazman), which defines component boundaries, interfaces, interactions, and quality attributes. Per SWEBOK, the architecture design stage establishes the structural envelope within which detailed design operates.",
    type: "text"
  },
  {
    level: 2,
    text: "1. Scope: Architecture Design vs Detailed Design",
    type: "header"
  },
  {
    text: "SWEBOK v4 divides the design lifecycle into three stages. This skill covers only the first. A separate detailed design step handles the deeper levels.",
    type: "text"
  },
  {
    headers: ["Stage", "Scope", "Who handles it"],
    rows: [
      ["Architecture Design", "System Context + Container levels (this skill)", "spec-to-architecture skill"],
      ["Detailed Design", "Component + Code levels (internal module structure)", "Separate detailed design step"]
    ],
    type: "table"
  },
  {
    level: 2,
    text: "2. Output Artifacts",
    type: "header"
  },
  {
    text: "The skill generates three files in architecture/:",
    type: "text"
  },
  {
    code: "architecture/\n  ├── system-context.md     # C4 Level 1: system and its external actors/systems\n  ├── container.md          # C4 Level 2: applications, data stores, services\n  └── README.md             # Architecture overview and traceability",
    language: "",
    type: "codeBlock"
  },
  {
    level: 2,
    text: "3. System Context Diagram (Level 1)",
    type: "header"
  },
  {
    text: "The System Context diagram shows the software system in the center, the users who interact with it, and the external systems it communicates with. Generate this using a Mermaid flowchart diagram.",
    type: "text"
  },
  {
    code: "flowchart LR\n  user[\"User<br/>Primary user of the system\"]\n  system[\"FeatureName<br/>System being specified\"]\n  external[\"External System<br/>Dependency\"]\n\n  user -- \"Uses (HTTPS)\" --> system\n  system -- \"Integrates with (API)\" --> external",
    language: "mermaid",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "3.1 Extracting Context from BDD",
    type: "header"
  },
  {
    items: [
      { text: "Person actors: extracted from BDD steps that mention user roles (Given a user... When an admin...). Each distinct role becomes a Person in the diagram." },
      { text: "External systems: extracted from BDD steps referencing external services (e.g., \"When the email service is called\", \"Given the payment gateway\"). These become System_Ext boxes." },
      { text: "The system itself: named by the feature name from the /specification output directory." }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "4. Container Diagram (Level 2)",
    type: "header"
  },
  {
    text: "The Container diagram zooms in on the system to show the high-level technical containers (applications, databases, microservices, APIs). Generate this using a Mermaid C4Container diagram.",
    type: "text"
  },
  {
    code: "flowchart TB\n  user[\"User\"]\n\n  subgraph system[\"FeatureName System\"]\n    api[\"API<br/>REST<br/>Handles incoming requests\"]\n    worker[\"Worker<br/>Background job<br/>Processes async tasks\"]\n    db[\"Database<br/>PostgreSQL<br/>Stores state\"]\n  end\n\n  user -- \"HTTPS\" --> api\n  api -- \"Reads/writes (SQL)\" --> db\n  worker -- \"Reads/writes (SQL)\" --> db",
    language: "mermaid",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "4.1 Extracting Containers from BDD",
    type: "header"
  },
  {
    items: [
      { text: "Containers are derived from the behaviors described in BDD scenarios. Each distinct capability (processing, storing, notifying, etc.) maps to a container candidate." },
      { text: "Data stores (ContainerDb) are identified from scenarios describing persistence (state changes, resource storage, records)." },
      { text: "Extract container interfaces from BDD action descriptions: inputs in Given clauses, side effects in Then clauses." }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "5. Quality Attribute Mapping",
    type: "header"
  },
  {
    text: "Non-functional requirements identified during /specification are mapped to architectural decisions in the architecture/README.md. Use SWEBOK quality attribute categories.",
    type: "text"
  },
  {
    headers: ["Quality Attribute", "Architecture Decision"],
    rows: [
      ["Performance", "Container sizing, caching strategy, async processing"],
      ["Security", "Authentication container, authorization boundaries, encryption"],
      ["Reliability", "Failover containers, retry logic, deployment observability"],
      ["Scalability", "Worker pool sizing, stateless API design"],
      ["Availability", "Replica count, health checks, graceful degradation"],
      ["Maintainability", "Separation of contracts vs implementation containers"],
      ["Testability", "Container interface isolation for mocking"]
    ],
    type: "table"
  },
  {
    level: 2,
    text: "6. SWEBOK Architecture Design Compliance",
    type: "header"
  },
  {
    text: "The architecture output MUST satisfy these SWEBOK v4 Chapter 2/3 principles:",
    type: "text"
  },
  {
    items: [
      { text: "Abstraction: The architecture shows essential structural elements only, not implementation details." },
      { text: "Modularization: Containers are separated by well-defined interfaces (Rel edges in C4 diagrams)." },
      { text: "Separation of Concerns: Each container has a single, clearly stated responsibility." },
      { text: "Verifiability: Container boundaries and interactions map directly to BDD scenarios (traceability)." }
    ],
    type: "unorderedList"
  }
];
