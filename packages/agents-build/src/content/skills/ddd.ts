/* eslint-disable sonar/no-duplicate-string */
import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";
import { cleanArchitecture } from "./ddd/clean-architecture.ts";
import { cqrsPattern } from "./ddd/cqrs-pattern.ts";
import { legacyModularSystems } from "./ddd/legacy-modular-systems.ts";
import { specificationPattern } from "./ddd/specification-pattern.ts";
import { strategicDesign } from "./ddd/strategic-design.ts";
import { tacticalPatterns } from "./ddd/tactical-patterns.ts";

export const ddd = defineSkill({
  content: [
    {
      level: 1,
      text: "Domain-Driven Design (DDD) Guideline Finder",
      type: "header"
    },
    {
      text: "This skill acts as a comprehensive reference guide to Domain-Driven Design (DDD) and Clean/Modular Architecture. It provides a structured taxonomy of strategic design, tactical patterns, clean layering, CQRS, and specifications to align software construction with business domains.",
      type: "text"
    },
    {
      level: 2,
      text: "Quick Decision Trees",
      type: "header"
    },
    {
      level: 3,
      text: '"I am designing system boundaries or modeling business concepts"',
      type: "header"
    },
    {
      code: "Which strategic task?\n├─ Discovering subdomains and capabilities → strategic-design.md\n├─ Designing bounded contexts and vocabulary → strategic-design.md\n└─ Mapping context interactions (ACL, Partnership, etc.) → strategic-design.md",
      language: "",
      type: "codeBlock"
    },
    {
      level: 3,
      text: '"I am writing domain objects and code structures"',
      type: "header"
    },
    {
      code: "Which tactical/architectural task?\n├─ Modeling aggregates, entities, and value objects → tactical-patterns.md\n├─ Separating application and domain logic → clean-architecture.md\n├─ Defining repository contracts or domain services → tactical-patterns.md\n└─ Structuring presentation and infrastructure layers → clean-architecture.md",
      language: "",
      type: "codeBlock"
    },
    {
      level: 3,
      text: '"I am refactoring queries, validations, or legacy code"',
      type: "header"
    },
    {
      code: "Which refactoring task?\n├─ Separating read paths and write paths (CQRS) → cqrs-pattern.md\n├─ Encapsulating business rules (Specifications) → specification-pattern.md\n└─ Refactoring legacy CRUD to modular monoliths → legacy-modular-systems.md",
      language: "",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "DDD Knowledge Index",
      type: "header"
    },
    {
      level: 3,
      text: "1. Strategic Design",
      type: "header"
    },
    {
      headers: ["Topic", "Reference Document", "Description / Keywords"],
      rows: [
        [
          "1.1 Ubiquitous Language",
          "[strategic-design.md](resources/strategic-design.md)",
          "Shared vocabulary, glossary, terminology alignment"
        ],
        [
          "1.2 Subdomains",
          "[strategic-design.md](resources/strategic-design.md)",
          "Core, Supporting, and Generic subdomain categorization"
        ],
        [
          "1.3 Bounded Contexts",
          "[strategic-design.md](resources/strategic-design.md)",
          "Semantic boundaries, modular design, single team ownership"
        ],
        [
          "1.4 Context Mapping",
          "[strategic-design.md](resources/strategic-design.md)",
          "Integration contracts, ACL, Partnership, Shared Kernel, Conformist"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "2. Tactical Patterns",
      type: "header"
    },
    {
      headers: ["Topic", "Reference Document", "Description / Keywords"],
      rows: [
        [
          "2.1 Entities and Value Objects",
          "[tactical-patterns.md](resources/tactical-patterns.md)",
          "Identity-driven objects, immutable value objects, structural equality"
        ],
        [
          "2.2 Anemic vs. Rich Models",
          "[tactical-patterns.md](resources/tactical-patterns.md)",
          "Transitioning property bags to behavior-encapsulated models"
        ],
        [
          "2.3 Aggregates and Invariants",
          "[tactical-patterns.md](resources/tactical-patterns.md)",
          "Consistency boundaries, aggregate roots, transactional boundaries"
        ],
        [
          "2.4 Domain Services",
          "[tactical-patterns.md](resources/tactical-patterns.md)",
          "Stateless operations spanning multiple aggregates"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "3. Clean Layering",
      type: "header"
    },
    {
      headers: ["Topic", "Reference Document", "Description / Keywords"],
      rows: [
        [
          "3.1 Four Architecture Layers",
          "[clean-architecture.md](resources/clean-architecture.md)",
          "Presentation, Application, Domain, and Infrastructure roles"
        ],
        [
          "3.2 Inward Dependency Flow",
          "[clean-architecture.md](resources/clean-architecture.md)",
          "Dependency rules, shielding the domain model from tech volatility"
        ],
        [
          "3.3 Persistence Ignorance",
          "[clean-architecture.md](resources/clean-architecture.md)",
          "Separating Domain Models from database-optimized Data Models"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "4. Advanced Refactoring",
      type: "header"
    },
    {
      headers: ["Topic", "Reference Document", "Description / Keywords"],
      rows: [
        [
          "4.1 CQRS Pattern",
          "[cqrs-pattern.md](resources/cqrs-pattern.md)",
          "Command-Query Separation (CQS), Task-Based UI, Mediator, Handler segregation"
        ],
        [
          "4.2 Specification Pattern",
          "[specification-pattern.md](resources/specification-pattern.md)",
          "Encapsulating reusable query, validation, and object creation rules"
        ],
        [
          "4.3 Legacy and Monoliths",
          "[legacy-modular-systems.md](resources/legacy-modular-systems.md)",
          "Refactoring legacy systems, modular monolith design, software architecture Zen"
        ]
      ],
      type: "table"
    }
  ] as MarkdownBlock[],
  description:
    "Domain-Driven Design (DDD), strategic subdomains, bounded contexts, aggregates, rich domain models, clean architecture layers, CQRS, and specifications.",
  name: "ddd",
  resources: [
    { content: strategicDesign, filename: "strategic-design.md" },
    { content: tacticalPatterns, filename: "tactical-patterns.md" },
    { content: cleanArchitecture, filename: "clean-architecture.md" },
    { content: cqrsPattern, filename: "cqrs-pattern.md" },
    { content: specificationPattern, filename: "specification-pattern.md" },
    { content: legacyModularSystems, filename: "legacy-modular-systems.md" }
  ]
});
