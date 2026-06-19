export const legacyModularSystems = `# Refactoring Legacy Systems and Modular Monoliths

This resource guides you through the process of modernizing legacy codebases, managing technical debt, and structuring applications using modular monolith design.

---

## 1. Refactoring Legacy Projects

Legacy codebases often contain business rules scattered across UI events, controllers, services, database triggers, and stored procedures. This results in technical debt, inconsistent behavior, high regression risks, and slow delivery velocity.

### 1.1 Step-by-Step Modernization Strategy
1. **Identify the Core Domain**: Locate the parts of the codebase that hold strategic business value (the Core Subdomain). Focus engineering effort here.
2. **Establish the Ubiquitous Language**: Document differences in terminology across systems to define context boundaries.
3. **Write Characterization Tests**: Before modifying legacy code, write integration tests that lock in the existing behavior to prevent regression.
4. **Extract and Encapsulate Behavior**: Refactor generic CRUD services by moving validations and state changes from controllers into specific domain methods on entities.
5. **Introduce Specifications and Handlers**: Replace duplicated queries and filters with composed specifications and command/query handlers.

---

## 2. Modular Monoliths vs. Distributed Monoliths

Software architectures often face premature distribution. Teams break down systems into microservices too early, violating the **First Law of Distributed Systems: Do not distribute.**

### 2.1 The Distributed Monolith Anti-Pattern
- **Description**: A system split across multiple independently deployed services that are still tightly coupled at runtime.
- **Consequences**:
  - Full cost of distributed systems (network latency, partial failures, remote debugging complexity).
  - Lack of service autonomy (changes in one service force deployments in others).
  - Out-of-process communication overhead.

### 2.2 Modular Monoliths
- **Description**: A single deployment unit (monolith) organized internally into distinct, highly decoupled vertical slices by domain feature.
- **Benefits**:
  - In-process communication (compile-time safety, fast execution).
  - Logical separation: Each module encapsulates its database schema and domain model.
  - Evolvability: If a module requires scaling or independent deployment, it can be extracted into a microservice easily.

---

## 3. Zen of Software Architecture

The Zen of Software Architecture focuses on minimalism, clarity, and durability:

1. **Simplicity**: Stripping away unnecessary frameworks, redundant layers, and speculative features until only the essential business model remains.
2. **Harmony**: Structuring software elements so they flow intuitively and speak the same language as the business.
3. **Timelessness**: Avoiding over-hyped industry trends, keeping domain logic independent of frameworks, and relying on enduring software engineering principles.
`;
