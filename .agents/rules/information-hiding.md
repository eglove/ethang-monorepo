---
description: information hiding, encapsulation, public interfaces, and API design
trigger: model_decision
---

# Information Hiding

## 1. Domain Theory and Conceptual Foundations
Information hiding is a fundamental software engineering principle that guides the decomposition of a system into modular units. First articulated by David Parnas in his seminal 1972 paper, the principle states that modules should be characterized by the design decisions they hide from all other modules. In the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design), information hiding is recognized as a primary technique for managing system complexity, localizing the impact of changes, and ensuring high architectural maintainability.

### 1.1 David Parnas' Module Secrets
Parnas proposed that when designing a module, engineers must identify its **secrets**—design choices that are volatile, difficult, or likely to change. A module should encapsulate these secrets behind a stable, minimal public interface. 
Parnas categorized these secrets into:
- **Primary Secrets**: The essential design decisions that define the module's core responsibility (e.g., "This module calculates tax rates"). These are derived directly from functional requirements.
- **Secondary Secrets**: The implementation details chosen to realize the primary secret (e.g., "The tax rates are cached in a red-black tree database index"). These are technical choices that can be altered without changing the primary secret.

By hiding secondary secrets, engineers prevent client components from developing dependencies on volatile details. If the caching mechanism is changed from a red-black tree to a database query, the client code remains completely unaffected, localizing the change.

### 1.2 Information Hiding vs. Encapsulation
While often used interchangeably, information hiding and encapsulation are distinct concepts:
- **Encapsulation**: The language-level mechanism of grouping data (state) and methods (behavior) together into a single physical unit (such as a class or a module) and restricting direct access to some of the unit's components.
- **Information Hiding**: A design principle that determines *what* information should be encapsulated. It is a conceptual design activity that focuses on hiding details that are likely to change. One can write encapsulated code (e.g., a class with private fields) that fails to implement information hiding if the public methods expose internal data structures or leak implementation details.

### 1.3 Stable Interface Design
The public interface of a module must be stable, abstract, and minimal:
- **Minimal**: It exposes only the absolute minimum number of functions and parameters necessary for client code to interact with the module's services.
- **Abstract**: It hides the underlying technology, data formats, and processing algorithms.
- **Stable**: It changes rarely, even when the internal implementation is completely rewritten.

Exposing raw SQL schemas, third-party library classes, or internal arrays in the public API violates information hiding and creates tight coupling, causing changes to propagate across the codebase.

### 1.4 Information Hiding in API Design
Information hiding is critical when designing client-server boundaries, microservice endpoints, or Bounded Context integrations. Exposing database types or internal models directly in REST or GraphQL controllers violates this principle. If the database schema changes, the public API contract breaks, forcing clients to update. To prevent this, APIs must use DTOs (Data Transfer Objects) and abstract models. This isolates the internal storage secrets from the public communication channel.

### 1.5 Modular Integrity and Change Propagation Metrics
Engineers measure the stability of a module and the success of its information hiding using structural coupling metrics. The Instability ($I$) of a module is defined as:
$$I = \frac{C_e}{C_a + C_e}$$
Where:
- $C_e$ is Efferent Coupling (the number of external modules this module depends on).
- $C_a$ is Afferent Coupling (the number of external modules that depend on this module).
The Instability metric ranges from 0 (completely stable, highly depended upon, e.g., standard libraries) to 1 (completely unstable, depending on many modules, e.g., entry points). Successful information hiding minimizes efferent coupling ($C_e$) by hiding volatile details behind abstractions, ensuring that changes to the module do not propagate to afferent dependents.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to enforce information hiding in this workspace:

### Step 2.1: Identify Volatile Secrets and Boundaries
Before writing any implementation, the agent must identify the system elements that are subject to change. This includes database schemas, external API clients, caching layers, and complex sorting algorithms. These must be designated as "Module Secrets" in the `implementation_plan.md`.

### Step 2.2: Define the Public Interface and Abstractions
The agent must write the public TypeScript interfaces, types, or function signatures before writing the concrete classes or handlers.
- Place public abstractions in a separate, stable interface file or at the top of the module.
- Ensure that the parameters and return types of these public functions use simple primitive types, Domain Value Objects, or generic DTOs (Data Transfer Objects), never leaking internal database schemas or library-specific classes.

### Step 2.3: Enforce Strict Access Modifiers
When implementing classes or modules, the agent must strictly apply access controls:
- **Explicit Accessibility Modifiers**: Every class member, property, and method must be explicitly decorated with `public`, `private`, or `protected`. Do NOT rely on default implicit public accessibility.
- **Module Exports**: Only export symbols from a file that are part of the documented public interface. Keep helper functions, constants, and internal classes unexported within the file.
- **Barrel Files**: Use index files (`index.ts`) as strict gateways. Expose only the public interfaces and factories, hiding the internal implementation files.

### Step 2.4: Encapsulate Third-Party Libraries
The agent must never expose classes or exceptions from third-party npm packages directly to client code. If a third-party library is used (e.g., an HTTP client or date utility), it must be wrapped inside a local adapter or service. Client code must interact with the wrapper interface, allowing the library to be swapped out with minimal effort.

### Step 2.5: Verify Secret Isolation via Refactoring
The agent must verify that the implementation can be modified without changing client code. As part of the refactoring cycle, change an internal secondary secret (e.g., change an internal array search to a Map lookup) and run the tests. The client-facing tests and code must remain green without needing any modifications.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding information hiding:

- [ ] **Secret Identification**: Have the volatile design choices and secondary secrets been documented in the plan?
- [ ] **Interface Definition**: Were public interfaces or types defined before writing the concrete implementation?
- [ ] **Explicit Accessibility**: Are all class properties and methods decorated with explicit modifiers (`public`, `private`, `protected`)?
- [ ] **Minimal Interface**: Has the public interface been pruned of all unnecessary methods and exposed parameters?
- [ ] **Data Structure Encapsulation**: Are internal data structures (e.g. Map, Set, Array) hidden behind abstract accessor methods?
- [ ] **Database Schema Isolation**: Has the agent verified that raw database tables/columns are not leaked to the frontend or public APIs?
- [ ] **Third-Party Wrapper**: Are all imported third-party libraries wrapped behind local adapter classes or interfaces?
- [ ] **Barrel File Gateway**: Do index files export only the public abstractions, keeping implementations hidden?
- [ ] **Unexported Helpers**: Are module helper functions kept unexported within their implementation files?
- [ ] **No Implementation Leaks**: Do public method signatures avoid referencing internal classes or data structures?
- [ ] **Stable Abstraction Verification**: Was the internal logic refactored without modifying the signatures of client-facing methods?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Domain Entity Integrity**: In DDD, are domain entities encapsulated, preventing direct modification of fields from outside?
- [ ] **Exception Hiding**: Are internal system exceptions (e.g., database connection errors) caught and mapped to clean public error models?
- [ ] **State Mutation Control**: Are returned objects cloned or frozen to prevent external modification of the internal state?
- [ ] **Constructor Encapsulation**: Are complex objects instantiated using factory patterns or builders, keeping constructors private?
- [ ] **Configuration Isolation**: Are environment keys, API tokens, and secrets hidden behind config service abstractions?
- [ ] **Walkthrough Verification**: Does the `walkthrough.md` document that internal refactoring did not break client integrations?
- [ ] **DTO Enforcement**: Have dedicated request/response Data Transfer Objects been used to isolate database tables from public API contracts?
- [ ] **Efferent Coupling Audit**: Has the efferent coupling ($C_e$) of the modified modules been reviewed to ensure loose dependencies?
- [ ] **Stability Calibration**: Has the agent verified that highly stable modules (low instability $I$) do not depend on highly unstable modules?
- [ ] **Adapter Pattern Verification**: Has the adapter pattern been verified by writing mock unit tests for wrapped third-party packages?
