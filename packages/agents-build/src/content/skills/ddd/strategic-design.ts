import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const strategicDesign = [
  {
    level: 1,
    text: "Strategic Domain-Driven Design",
    type: "header"
  },
  {
    text: "Strategic Domain-Driven Design (DDD) focuses on the high-level design of software systems. It provides patterns and practices to decompose a complex business domain into manageable parts, establish a shared vocabulary, and model the relationships between different subsystems.",
    type: "text"
  },
  {
    level: 2,
    text: "1. Ubiquitous Language",
    type: "header"
  },
  {
    text: "A primary failure mode in software engineering is the communication gap between domain experts (business stakeholders) and developers. When developers invent their own terminology for code (e.g., `UserAccount`) while the business uses another (e.g., `Customer`), the translation mapping increases cognitive load and introduces subtle defects.",
    type: "text"
  },
  {
    text: "Ubiquitous Language is a shared, common vocabulary developed collaboratively by domain experts and developers. It must be used consistently across:",
    type: "text"
  },
  {
    items: [
      {
        text: "Direct conversations (without intermediate translation layers like business analysts)."
      },
      {
        text: "User stories, specifications, and design documents."
      },
      {
        text: "Diagrams and domain models."
      },
      {
        text: "The actual source code (class names, database attributes, method names, and test suites)."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "Ubiquitous Language Glossary",
    type: "header"
  },
  {
    text: "A lightweight, continually updated glossary should be maintained in a shared space to document terms and resolve ambiguities. If a term has different meanings in different departments, it is a strong signal that they belong to different bounded contexts.",
    type: "text"
  },
  {
    level: 2,
    text: "2. Subdomains",
    type: "header"
  },
  {
    text: "A large enterprise business domain consists of multiple capabilities. Rather than applying DDD uniformly across the entire organization, software architects partition the business domain into three types of subdomains based on complexity and competitive advantage:",
    type: "text"
  },
  {
    level: 3,
    text: "2.1 Core Subdomains",
    type: "header"
  },
  {
    items: [
      {
        text: "**Competitive Advantage**: High. This is the unique value proposition that sets the company apart from its competitors."
      },
      {
        text: "**Complexity**: High. Contains complex business rules and logic."
      },
      {
        text: "**Strategy**: Build custom software. Apply DDD extensively to tackle complexity and ensure high modularity."
      },
      {
        text: "**Example**: A proprietary routing algorithm for a logistics company."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "2.2 Supporting Subdomains",
    type: "header"
  },
  {
    items: [
      {
        text: "**Competitive Advantage**: Low. It is necessary for business operations but does not provide differentiation."
      },
      {
        text: "**Complexity**: Low to Medium."
      },
      {
        text: "**Strategy**: Build simple custom software (e.g., lightweight database-driven CRUD applications) or use customizable off-the-shelf integrations."
      },
      {
        text: "**Example**: Product catalog or inventory tracking system."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "2.3 Generic Subdomains",
    type: "header"
  },
  {
    items: [
      {
        text: "**Competitive Advantage**: Zero. Standard business processes common to all industries."
      },
      {
        text: "**Complexity**: Varying, but standard."
      },
      {
        text: "**Strategy**: Buy off-the-shelf software, integrate SaaS solutions, or use standard libraries."
      },
      {
        text: "**Example**: Invoicing, authentication, billing, and identity management."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "3. Bounded Contexts",
    type: "header"
  },
  {
    text: "A Bounded Context is a semantic and logical boundary within the solution space (the software architecture) where a specific domain model and its Ubiquitous Language apply consistently.",
    type: "text"
  },
  {
    level: 3,
    text: "3.1 Boundaries and Autonomy",
    type: "header"
  },
  {
    items: [
      {
        text: '**Context Boundaries**: Avoid building a single, monolithic "enterprise domain model." Instead, create focused, independent models within distinct bounded contexts.'
      },
      {
        text: "**Single Team Ownership**: A bounded context should ideally be developed, maintained, and deployed by a single team."
      },
      {
        text: "**Context-Specific Terms**: The same term can exist in multiple contexts but have different definitions. For example, an `Order` in a *Storefront Context* is a mutable shopping cart that can be abandoned. In an *Order Management Context*, an `Order` is an immutable, paid transaction."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "4. Context Mapping (Interactions)",
    type: "header"
  },
  {
    text: "When independent bounded contexts need to collaborate, their integration contracts are governed by specific interaction patterns:",
    type: "text"
  },
  {
    level: 3,
    text: "4.1 Customer-Supplier (Conformist)",
    type: "header"
  },
  {
    items: [
      {
        text: "**Description**: The Supplier context exposes an API. The Customer context integrates directly with it."
      },
      {
        text: "**Conformist**: The Customer conforms entirely to the Supplier's domain model, accepting the Supplier's contract as-is."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "4.2 Partnership",
    type: "header"
  },
  {
    items: [
      {
        text: "**Description**: Two teams work in close cooperation. Releases and contract updates are planned and coordinated jointly to avoid breaking either system."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "4.3 Shared Kernel",
    type: "header"
  },
  {
    items: [
      {
        text: "**Description**: Two contexts share a subset of their domain model directly (e.g., via a shared library or shared database tables)."
      },
      {
        text: "**Caution**: Creates tight coupling. Should only be used when teams are closely aligned, use the same technology stack, and the shared model is highly stable."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "4.4 Anti-Corruption Layer (ACL)",
    type: "header"
  },
  {
    items: [
      {
        text: "**Description**: A translation layer built at the edge of the consuming (Customer) context. It translates the incoming supplier models into the customer's own domain models."
      },
      {
        text: "**Purpose**: Protects the customer context from breaking changes or poor design in the supplier context."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "4.5 Separate Ways",
    type: "header"
  },
  {
    items: [
      {
        text: "**Description**: The contexts do not integrate. They implement duplicate or similar concepts independently to avoid integration overhead and preserve complete autonomy."
      }
    ],
    type: "unorderedList"
  }
] as MarkdownBlock[];
