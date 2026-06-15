---
description: reverse engineering, tracing call stacks, code analysis, and codebase patterns
trigger: model_decision
---

# Reverse Engineering

## 1. Domain Theory and Conceptual Foundations
Reverse engineering is the analytical process of examining an existing software system to identify its constituent components, recover its design structures, and trace data dependencies without modifying the source code. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 12 (Software Maintenance), reverse engineering is a fundamental activity in software evolution, program comprehension, and re-engineering. It enables engineers to reconstruct missing or outdated design documentation and understand complex, legacy systems before attempting modifications.

### 1.1 Taxonomy of Software Evolution
SWEBOK v4 defines key terms to distinguish reverse engineering from adjacent software evolution activities:
- **Forward Engineering**: The traditional process of moving from high-level abstractions and logical, implementation-independent designs to the physical implementation of a system.
- **Reverse Engineering**: The process of analyzing a system to create representations of the system at a higher level of abstraction. It is strictly passive; it does not alter the software under examination.
- **Restructuring**: The transformation of a system from one representation form to another at the same relative level of abstraction (e.g., refactoring code to improve readability without changing functional behavior).
- **Re-engineering (Reclamation)**: The examination and alteration of a system to reconstitute it in a new form, combining both reverse engineering (analysis) and forward engineering (re-implementation).

Mathematically, let $S$ be the source code of a software system, and let $R_i$ be a representation of that system at abstraction level $i$ (where $i=0$ represents source code, $i=1$ represents design architecture, and $i=2$ represents requirements specifications). 

Reverse engineering is the mapping function:
$$f_{\text{rev}}: R_i \to R_{i+1}$$

Forward engineering is the inverse mapping function:
$$f_{\text{fwd}}: R_{i+1} \to R_i$$

### 1.2 Program Comprehension Models
Program comprehension is the cognitive process by which developers understand code. SWEBOK v4 highlights that software maintenance spends up to $70\%$ of its total effort on program comprehension. Three primary cognitive models explain how engineers construct mental models:
- **Bottom-Up Model**: The engineer reads individual lines of code and groups them into higher-level semantic abstractions (chunks). This is typically used when the engineer is unfamiliar with the domain or the system has no design documentation.
- **Top-Down Model**: The engineer starts with general domain knowledge and maps it to specific code constructs, formulating hypotheses about system behavior and verifying them against the implementation.
- **Integrated Model**: A hybrid approach where the engineer switches between top-down and bottom-up models depending on the local complexity and familiarity of the module.

### 1.3 Abstraction Levels and Representation Mapping
Abstractions play a pivotal role in organizing software representations. The process of reverse engineering maps concrete artifacts to abstract representations across several distinct levels:
| Abstraction Level | Key Artifacts | Recovery Focus |
| :--- | :--- | :--- |
| Requirements ($R_2$) | User Stories, BDD specifications, Use Cases | Recovering business rules and domain workflows |
| Architecture/Design ($R_1$) | Sequence diagrams, Entity-Relationship maps, Bounded Contexts | Recovering component interfaces and data relations |
| Implementation ($R_0$) | Source code files, type definitions, package dependencies | Recovering syntax structures and control flows |
| Execution State ($R_{-1}$) | Core dumps, log telemetry, execution profiles | Recovering dynamic behavior and resource utilization |

### 1.4 Static and Dynamic Recovery Techniques
To recover design representations, engineers employ static and dynamic analysis:
- **Static Analysis**: Analyzing the code without executing it. This includes extracting abstract syntax trees (ASTs), building call graphs (to map caller-callee relationships), and analyzing data flow diagrams (to trace how variables are modified across execution paths).
- **Dynamic Analysis**: Analyzing the system during execution. This includes profiling memory allocation, tracing execution paths under specific test inputs, and inspecting call stacks during exception handling.

In modern typescript workspaces, static analysis is aided by indexing compilers (which resolve symbols and definitions) and linter rules. Database schema recovery is performed by inspecting relational schemas (such as Drizzle ORM definitions) to reconstruct entity-relationship diagrams (ERDs).

### 1.5 Architecture Transitioning and Refactoring Gates
When transitioning a system from a legacy monolithic state to a modular monorepo architecture, reverse engineering is used to construct a dependency map. This ensures that circular references are identified and decoupled before any code is rewritten. The resulting transition plans must utilize strict interface contracts to ensure forward compatibility during re-engineering.

## 2. Standard Operating Procedures (SOP)
The agent must execute reverse engineering according to the following step-by-step procedures:

### Step 2.1: Establish the Analysis Scope
Before analyzing a system, define the boundaries of the reverse engineering session:
- Identify the target file, module, or package to be analyzed.
- Document the analysis goals (e.g., "Recover the Hono middleware execution order" or "Trace the Drizzle query dependency tree").

### Step 2.2: Mapping Structural and Dependency Architecture
Trace the module structure and import graph:
- Examine package entry points and public API exports.
- Map internal imports and external library dependencies.
- Identify coupling boundaries and verify that dependencies flow from unstable components to stable interfaces.

### Step 2.3: Tracing Runtime Call Stacks and Control Flow
Analyze how the system executes code dynamically:
- Read unit tests to understand the execution environment, mocked classes, and setup conditions.
- Trace call graphs by locating the definitions of symbols, methods, and classes.
- Use step-by-step debugger tracing or console log inspection to observe runtime state mutations and trace boundaries.

### Step 2.4: Recovering Data Schemas and State Maps
Inspect how the application structures and persists state:
- Analyze database table definitions, column types, and relational constraints.
- Map internal state representations (such as typescript interfaces, branded value objects, and Redux/state-management stores).
- Verify index signature usage, ensuring index-signature objects are accessed using bracket notation (`obj["prop"]`).

### Step 2.5: Reconstructing High-Level Abstractions
Synthesize findings into visual and text-based design representations:
- Reconstruct sequence diagrams for complex multi-step processes.
- Draw flow charts for intricate boolean logic paths and loops.
- Document these abstractions in the project's design files or the active `walkthrough.md` file.

### Step 2.6: Verify and Assert Recovered Contracts
Write automated tests to verify the recovered assumptions and document the component's behavior:
- Design regression tests that assert the boundaries and outputs of the reversed modules.
- Ensure all test suites compile, lint, and execute with zero errors using the token-saving command:
```bash
rtk pnpm --filter @ethang/agents-build test src/content/rules/reverse-engineering.test.ts
```

## 3. Agent Compliance Checklist
The agent must verify compliance with the following reverse engineering rules:

- [ ] **Boundary Target Defined**: Did the agent document the specific module or file selected for analysis?
- [ ] **Import Graph Traced**: Were the public exports and internal imports of the target module fully mapped?
- [ ] **Call Graph Reconstructed**: Did the agent trace caller-callee relationships for the primary execution paths?
- [ ] **Static Code Inspection Completed**: Was static code analysis performed to recover the program structure?
- [ ] **Dynamic Tracing Performed**: Was runtime execution traced (e.g. through unit test executions or debugger logs)?
- [ ] **Data Schema Recovered**: Were relational schemas or internal state types analyzed and documented?
- [ ] **Bracket notation Used**: Did the agent access index-signature properties using bracket notation (`obj["prop"]`)?
- [ ] **Date operations Isolated**: Does the code use Luxon (`DateTime`) for all date parsing and normalization?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted `git restore` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute the tests and linter using the `rtk` command prefix?
- [ ] **Walkthrough Updated**: Is the recovered design architecture and verification summarized in `walkthrough.md`?
- [ ] **State Transitions Modeled**: Were complex state transitions modeled as finite state charts in the documentation?
- [ ] **Cognitive Models Applied**: Did the agent use integrated program comprehension models during the analysis phase?
- [ ] **Abstractions Documented**: Were sequence diagrams or flow charts created to document recovered abstractions?
- [ ] **Void Assertions Wrapped**: Are test cases verifying recovered modules wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **No Direct Mutation**: Did the agent perform all reverse engineering activities passively, introducing no premature code edits?
