# Strategic Domain-Driven Design

Strategic Domain-Driven Design (DDD) focuses on the high-level design of software systems. It provides patterns and practices to decompose a complex business domain into manageable parts, establish a shared vocabulary, and model the relationships between different subsystems.

## 1. Ubiquitous Language

A primary failure mode in software engineering is the communication gap between domain experts (business stakeholders) and developers. When developers invent their own terminology for code (e.g., `UserAccount`) while the business uses another (e.g., `Customer`), the translation mapping increases cognitive load and introduces subtle defects.

Ubiquitous Language is a shared, common vocabulary developed collaboratively by domain experts and developers. It must be used consistently across:

* Direct conversations (without intermediate translation layers like business analysts).
* User stories, specifications, and design documents.
* Diagrams and domain models.
* The actual source code (class names, database attributes, method names, and test suites).

### Ubiquitous Language Glossary

A lightweight, continually updated glossary should be maintained in a shared space to document terms and resolve ambiguities. If a term has different meanings in different departments, it is a strong signal that they belong to different bounded contexts.

## 2. Subdomains

A large enterprise business domain consists of multiple capabilities. Rather than applying DDD uniformly across the entire organization, software architects partition the business domain into three types of subdomains based on complexity and competitive advantage:

### 2.1 Core Subdomains

* **Competitive Advantage**: High. This is the unique value proposition that sets the company apart from its competitors.
* **Complexity**: High. Contains complex business rules and logic.
* **Strategy**: Build custom software. Apply DDD extensively to tackle complexity and ensure high modularity.
* **Example**: A proprietary routing algorithm for a logistics company.

### 2.2 Supporting Subdomains

* **Competitive Advantage**: Low. It is necessary for business operations but does not provide differentiation.
* **Complexity**: Low to Medium.
* **Strategy**: Build simple custom software (e.g., lightweight database-driven CRUD applications) or use customizable off-the-shelf integrations.
* **Example**: Product catalog or inventory tracking system.

### 2.3 Generic Subdomains

* **Competitive Advantage**: Zero. Standard business processes common to all industries.
* **Complexity**: Varying, but standard.
* **Strategy**: Buy off-the-shelf software, integrate SaaS solutions, or use standard libraries.
* **Example**: Invoicing, authentication, billing, and identity management.

## 3. Bounded Contexts

A Bounded Context is a semantic and logical boundary within the solution space (the software architecture) where a specific domain model and its Ubiquitous Language apply consistently.

### 3.1 Boundaries and Autonomy

* **Context Boundaries**: Avoid building a single, monolithic "enterprise domain model." Instead, create focused, independent models within distinct bounded contexts.
* **Single Team Ownership**: A bounded context should ideally be developed, maintained, and deployed by a single team.
* **Context-Specific Terms**: The same term can exist in multiple contexts but have different definitions. For example, an `Order` in a *Storefront Context* is a mutable shopping cart that can be abandoned. In an *Order Management Context*, an `Order` is an immutable, paid transaction.

## 4. Context Mapping (Interactions)

When independent bounded contexts need to collaborate, their integration contracts are governed by specific interaction patterns:

### 4.1 Customer-Supplier (Conformist)

* **Description**: The Supplier context exposes an API. The Customer context integrates directly with it.
* **Conformist**: The Customer conforms entirely to the Supplier's domain model, accepting the Supplier's contract as-is.

### 4.2 Partnership

* **Description**: Two teams work in close cooperation. Releases and contract updates are planned and coordinated jointly to avoid breaking either system.

### 4.3 Shared Kernel

* **Description**: Two contexts share a subset of their domain model directly (e.g., via a shared library or shared database tables).
* **Caution**: Creates tight coupling. Should only be used when teams are closely aligned, use the same technology stack, and the shared model is highly stable.

### 4.4 Anti-Corruption Layer (ACL)

* **Description**: A translation layer built at the edge of the consuming (Customer) context. It translates the incoming supplier models into the customer's own domain models.
* **Purpose**: Protects the customer context from breaking changes or poor design in the supplier context.

### 4.5 Separate Ways

* **Description**: The contexts do not integrate. They implement duplicate or similar concepts independently to avoid integration overhead and preserve complete autonomy.
