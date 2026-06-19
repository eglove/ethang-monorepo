import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const legacyModularSystems = [
  {
    level: 1,
    text: "Refactoring Legacy Systems and Modular Monoliths",
    type: "header"
  },
  {
    text: "This resource guides you through the process of modernizing legacy codebases, managing technical debt, and structuring applications using modular monolith design.",
    type: "text"
  },
  {
    level: 2,
    text: "1. Refactoring Legacy Projects",
    type: "header"
  },
  {
    text: "Legacy codebases often contain business rules scattered across UI events, controllers, services, database triggers, and stored procedures. This results in technical debt, inconsistent behavior, high regression risks, and slow delivery velocity.",
    type: "text"
  },
  {
    level: 3,
    text: "1.1 Step-by-Step Modernization Strategy",
    type: "header"
  },
  {
    items: [
      {
        text: "**Identify the Core Domain**: Locate the parts of the codebase that hold strategic business value (the Core Subdomain). Focus engineering effort here."
      },
      {
        text: "**Establish the Ubiquitous Language**: Document differences in terminology across systems to define context boundaries."
      },
      {
        text: "**Write Characterization Tests**: Before modifying legacy code, write integration tests that lock in the existing behavior to prevent regression."
      },
      {
        text: "**Extract and Encapsulate Behavior**: Refactor generic CRUD services by moving validations and state changes from controllers into specific domain methods on entities."
      },
      {
        text: "**Introduce Specifications and Handlers**: Replace duplicated queries and filters with composed specifications and command/query handlers."
      }
    ],
    type: "numberedList"
  },
  {
    level: 2,
    text: "2. Modular Monoliths vs. Distributed Monoliths",
    type: "header"
  },
  {
    text: "Software architectures often face premature distribution. Teams break down systems into microservices too early, violating the **First Law of Distributed Systems: Do not distribute.**",
    type: "text"
  },
  {
    level: 3,
    text: "2.1 The Distributed Monolith Anti-Pattern",
    type: "header"
  },
  {
    items: [
      {
        text: "**Description**: A system split across multiple independently deployed services that are still tightly coupled at runtime."
      },
      {
        text: "**Consequences**:\n- Full cost of distributed systems (network latency, partial failures, remote debugging complexity).\n- Lack of service autonomy (changes in one service force deployments in others).\n- Out-of-process communication overhead."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "2.2 Modular Monoliths",
    type: "header"
  },
  {
    items: [
      {
        text: "**Description**: A single deployment unit (monolith) organized internally into distinct, highly decoupled vertical slices by domain feature."
      },
      {
        text: "**Benefits**:\n- In-process communication (compile-time safety, fast execution).\n- Logical separation: Each module encapsulates its database schema and domain model.\n- Evolvability: If a module requires scaling or independent deployment, it can be extracted into a microservice easily."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "3. Zen of Software Architecture",
    type: "header"
  },
  {
    text: "The Zen of Software Architecture focuses on minimalism, clarity, and durability:",
    type: "text"
  },
  {
    items: [
      {
        text: "**Simplicity**: Stripping away unnecessary frameworks, redundant layers, and speculative features until only the essential business model remains."
      },
      {
        text: "**Harmony**: Structuring software elements so they flow intuitively and speak the same language as the business."
      },
      {
        text: "**Timelessness**: Avoiding over-hyped industry trends, keeping domain logic independent of frameworks, and relying on enduring software engineering principles."
      }
    ],
    type: "numberedList"
  }
] as MarkdownBlock[];
