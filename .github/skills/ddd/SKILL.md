---
description: Domain-Driven Design (DDD), strategic subdomains, bounded contexts, aggregates, rich domain models, clean architecture layers, CQRS, and specifications.
name: ddd
---

# Domain-Driven Design (DDD) Reference

Reference guide to Domain-Driven Design (DDD) and Clean/Modular Architecture. Provides a structured taxonomy of strategic design, tactical patterns, clean layering, CQRS, and specifications to align software construction with business domains.

## Quick Decision Trees

### "I am designing system boundaries or modeling business concepts"

```
Which strategic task?
├─ Discovering subdomains and capabilities → strategic-design.md
├─ Designing bounded contexts and vocabulary → strategic-design.md
└─ Mapping context interactions (ACL, Partnership, etc.) → strategic-design.md
```

### "I am writing domain objects and code structures"

```
Which tactical/architectural task?
├─ Modeling aggregates, entities, and value objects → tactical-patterns.md
├─ Separating application and domain logic → clean-architecture.md
├─ Defining repository contracts or domain services → tactical-patterns.md
└─ Structuring presentation and infrastructure layers → clean-architecture.md
```

### "I am refactoring queries, validations, or legacy code"

```
Which refactoring task?
├─ Separating read paths and write paths (CQRS) → cqrs-pattern.md
├─ Encapsulating business rules (Specifications) → specification-pattern.md
└─ Refactoring legacy CRUD to modular monoliths → legacy-modular-systems.md
```

## DDD Knowledge Index

### 1. Strategic Design

| Topic | Reference Document | Description / Keywords |
| --- | --- | --- |
| 1.1 Ubiquitous Language | [strategic-design.md](resources/strategic-design.md) | Shared vocabulary, glossary, terminology alignment |
| 1.2 Subdomains | [strategic-design.md](resources/strategic-design.md) | Core, Supporting, and Generic subdomain categorization |
| 1.3 Bounded Contexts | [strategic-design.md](resources/strategic-design.md) | Semantic boundaries, modular design, single team ownership |
| 1.4 Context Mapping | [strategic-design.md](resources/strategic-design.md) | Integration contracts, ACL, Partnership, Shared Kernel, Conformist |

### 2. Tactical Patterns

| Topic | Reference Document | Description / Keywords |
| --- | --- | --- |
| 2.1 Entities and Value Objects | [tactical-patterns.md](resources/tactical-patterns.md) | Identity-driven objects, immutable value objects, structural equality |
| 2.2 Anemic vs. Rich Models | [tactical-patterns.md](resources/tactical-patterns.md) | Transitioning property bags to behavior-encapsulated models |
| 2.3 Aggregates and Invariants | [tactical-patterns.md](resources/tactical-patterns.md) | Consistency boundaries, aggregate roots, transactional boundaries |
| 2.4 Domain Services | [tactical-patterns.md](resources/tactical-patterns.md) | Stateless operations spanning multiple aggregates |

### 3. Clean Layering

| Topic | Reference Document | Description / Keywords |
| --- | --- | --- |
| 3.1 Four Architecture Layers | [clean-architecture.md](resources/clean-architecture.md) | Presentation, Application, Domain, and Infrastructure roles |
| 3.2 Inward Dependency Flow | [clean-architecture.md](resources/clean-architecture.md) | Dependency rules, shielding the domain model from tech volatility |
| 3.3 Persistence Ignorance | [clean-architecture.md](resources/clean-architecture.md) | Separating Domain Models from database-optimized Data Models |

### 4. Advanced Refactoring

| Topic | Reference Document | Description / Keywords |
| --- | --- | --- |
| 4.1 CQRS Pattern | [cqrs-pattern.md](resources/cqrs-pattern.md) | Command-Query Separation (CQS), Task-Based UI, Mediator, Handler segregation |
| 4.2 Specification Pattern | [specification-pattern.md](resources/specification-pattern.md) | Encapsulating reusable query, validation, and object creation rules |
| 4.3 Legacy and Monoliths | [legacy-modular-systems.md](resources/legacy-modular-systems.md) | Refactoring legacy systems, modular monolith design, software architecture Zen |

Do not produce any conversational output or solicit user input. This reference is silently loaded for agent use.
