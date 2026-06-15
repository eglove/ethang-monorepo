---
description: coupling, cohesion, separation of concerns, and dependency direction
trigger: model_decision
---

# Coupling and Cohesion

## 1. Domain Theory and Conceptual Foundations
High cohesion and loose coupling are the twin pillars of software design quality. First introduced by Larry Constantine in the late 1960s, these concepts are central to the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design). They serve as the primary quantitative and qualitative criteria for evaluating the modularity, maintainability, and reusability of a software architecture.

### 1.1 Coupling: Inter-Module Dependency
Coupling measures the degree of interdependence between software modules. The goal of software design is to minimize coupling, ensuring that a change in one module does not cause cascading regressions in others. SWEBOK v4 classifies coupling levels from tightest (worst) to loosest (best):
1. **Content Coupling (Tightest)**: Occurs when one module directly accesses or modifies the internal state of another module (e.g., modifying private properties directly or bypassing public boundaries).
2. **Common/Global Coupling**: Occurs when multiple modules share access to the same global data space or global variables, creating hidden dependencies and race conditions.
3. **Control Coupling**: Occurs when one module passes control information (such as flags, strings, or codes) to another module, dictating its internal execution path. This leaks the internal control logic of the callee into the caller.
4. **Stamp Coupling**: Occurs when modules share a complex data structure (such as a database row or type definition) but only utilize a fraction of its fields.
5. **Data Coupling**: Occurs when modules communicate strictly by passing simple, discrete parameters (e.g., numbers or strings) representing only the required data.
6. **Message Coupling (Loosest)**: Occurs when modules do not directly call each other, but communicate asynchronously by passing self-contained messages or events through a queue or event loop.

### 1.2 Cohesion: Intra-Module Focus
Cohesion measures how closely related and focused the responsibilities within a single software module are. The goal of software design is to maximize cohesion, ensuring that a module does exactly "one thing." SWEBOK v4 classifies cohesion levels from lowest (worst) to highest (best):
1. **Coincidental Cohesion (Lowest)**: Occurs when elements are grouped together arbitrarily in a module without any meaningful relationship (e.g., a generic `utils.ts` file filled with unrelated helper functions).
2. **Logical Cohesion**: Occurs when a module groups elements that perform logically similar tasks but are functionally distinct (e.g., a single file containing all form validation logic for unrelated domains).
3. **Temporal Cohesion**: Occurs when elements are grouped because they must execute at the same time (e.g., an initialization class that configures databases, registers loggers, and seeds data).
4. **Procedural Cohesion**: Occurs when elements are grouped to enforce a specific execution sequence, even if they operate on different data.
5. **Communicational Cohesion**: Occurs when elements group together because they operate on the same input data or produce the same output data.
6. **Sequential Cohesion**: Occurs when the output of one element serves as the input to another in a step-by-step pipeline (e.g., data transformation sequences).
7. **Functional Cohesion (Highest)**: Occurs when all elements of a module contribute directly to a single, well-defined mathematical or logical function.

### 1.3 Dependency Inversion and DDD Context Maps
To enforce loose coupling, software designs must apply the **Dependency Inversion Principle (DIP)**: high-level policy modules must not depend on low-level detail modules; both must depend on abstractions.
In Domain-Driven Design (DDD), coupling is managed across Bounded Context boundaries. A Context Map defines the integration relationships (such as Customer-Supplier, Shared Kernel, or Customer-Supplier with an Anti-Corruption Layer) to prevent model pollution from tight cross-boundary coupling.

### 1.4 The Law of Demeter (Principle of Least Knowledge)
To prevent structural coupling, engineers apply the **Law of Demeter (LoD)**. The principle states that a method $M$ of an object $O$ may only invoke the methods of the following kinds of objects:
- $O$ itself.
- $M$'s parameters.
- Any objects created/instantiated within $M$.
- $O$'s direct component objects.
The object should not traverse connections to call methods on stranger objects. Violating this law (e.g., writing method chains like `user.getProfile().getAddress().getZipCode()`) creates tight structural coupling, meaning changes to the Address structure will break the caller class, violating information hiding.

### 1.5 Cohesion Metrics: Lack of Cohesion in Methods (LCOM)
Architects use quantitative metrics to evaluate cohesion in classes. The **Lack of Cohesion in Methods (LCOM)** metric measures the structural cohesion of a class by analyzing the intersection of instance variables used by its methods.
For a class with methods $M_1, M_2, ..., M_n$ and instance variables $I$, let $P$ be the set of method pairs that do not share any instance variables, and $Q$ be the set of method pairs that do share at least one instance variable.
$$\text{LCOM} = \begin{cases} |P| - |Q| & \text{if } |P| > |Q| \\ 0 & \text{otherwise} \end{cases}$$
A high LCOM value indicates that many methods do not share fields, suggesting that the class has disparate responsibilities and should be split into smaller, more cohesive functional classes.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to optimize coupling and cohesion in this workspace:

### Step 2.1: Audit Module Cohesion
Before writing code, the agent must check if the target module has a single, cohesive responsibility:
- Audit files like `utils.ts` or general classes. If a file contains unrelated domains (coincidental cohesion), the agent must refactor and extract them into separate domain-specific helpers.
- Ensure that every class or function implements the Single Responsibility Principle (SRP).

### Step 2.2: Map and Reduce Coupling
The agent must scan the import declarations of the files being modified. The agent must:
- Eliminate any imports of concrete implementation classes from other features.
- Replace concrete imports with abstract TypeScript types or interface declarations.
- Verify that dependencies flow in the direction of stable abstractions (the core domain) rather than volatile adapters.

### Step 2.3: Eliminate Control Flags
The agent must scan function signatures for boolean control flags (e.g., `saveUser(user, sendEmail?: boolean)`). These flags indicate control coupling:
- Refactor the function by splitting it into two separate, cohesive functions (e.g., `saveUser(user)` and a separate event handler that listens for user creation to send emails).
- Alternatively, use a polymorphic strategy or strategy pattern to encapsulate execution paths.

### Step 2.4: Apply Stamp Coupling Pruning
When passing data between functions or components:
- Do NOT pass the entire database record or global context if only a few fields are needed.
- Destructure the parameter object in the function signature, or define a narrow TypeScript type representing only the required fields.

### Step 2.5: Verify Modularity via Isolation Testing
The agent must verify that the refactored module can be compiled and unit tested in isolation:
- Write mock assertions for all external dependencies.
- Ensure that running the targeted test (e.g., `rtk pnpm test <filename>`) does not require loading database drivers or external web servers.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding coupling and cohesion:

- [ ] **Single Responsibility Audit**: Does every modified class or function have exactly one reason to change?
- [ ] **Coincidental Cohesion Avoided**: Have generic, multi-domain "utils" files been refactored into domain-specific helpers?
- [ ] **Control Coupling Eliminated**: Have all boolean control flags been removed from function signatures?
- [ ] **Data Coupling Promotion**: Are functions designed to accept only the specific primitive arguments they require?
- [ ] **Stamp Coupling Pruned**: Have large record structures been pruned using destructured parameters or narrow type definitions?
- [ ] **Dependency Direction Verification**: Do imports flow in the direction of stable abstractions (interfaces/types) rather than concrete implementations?
- [ ] **No Content Coupling**: Has the agent verified that no private class fields are accessed directly from outside the class?
- [ ] **Global State Isolation**: Have global variables and common-coupled state configurations been eliminated?
- [ ] **Dependency Inversion Applied**: Do concrete classes implement interfaces defined by high-level modules?
- [ ] **Polymorphism for Control**: Was inheritance or the strategy pattern used instead of switch-case statements on type codes?
- [ ] **Isolated Compile Check**: Does the package build successfully without importing unrelated packages?
- [ ] **Mocked Test Verification**: Are all external module dependencies mocked in unit tests?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **DDD Bounded Context Integrity**: Have domain models been protected from external context pollution using Anti-Corruption Layers?
- [ ] **Message-Driven Communication**: For cross-context flows, is integration achieved via asynchronous event models?
- [ ] **Temporal Cohesion Refactored**: Have initialization processes been split into individual, sequentially executed services?
- [ ] **API Payload Isolation**: Are controller payloads translated to domain models immediately upon entry?
- [ ] **Walkthrough Verification**: Does the `walkthrough.md` confirm that coupling has been reduced and cohesion increased?
- [ ] **Law of Demeter Audit**: Have long method chains (e.g., `a.getB().getC()` ) been refactored to prevent structural coupling?
- [ ] **LCOM Evaluation**: Has the Lack of Cohesion in Methods (LCOM) been evaluated for large classes, and have they been split if LCOM is high?
- [ ] **Interface Segregation Check**: Do clients depend only on the specific methods they use, rather than fat interfaces?
- [ ] **Efferent/Afferent Balance**: Has the agent verified that highly coupled helper modules are functionally cohesive?
