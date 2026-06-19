import { defineRule } from "../../define.ts";

export const maintenanceTechniques = defineRule({
  content: `# Software Maintenance Techniques

## 1. Domain Theory and Conceptual Foundations
Software maintenance techniques represent the specialized technical methods used by engineers to comprehend, modify, and optimize existing software systems. As defined in SWEBOK v4 Chapter 7, Section 4, maintenance is distinct from greenfield development because it requires manipulating code written by others. Program comprehension is the foundational step, leveraging cognitive models (such as top-down and bottom-up strategies) to trace system execution paths. Software reengineering—including refactoring, code translation, and architectural migration—aims to improve system design and reduce technical debt. Reverse engineering, static and dynamic slicing, and design recovery extract high-level architectural abstractions from source code. Finally, modern maintenance relies on automated continuous integration, delivery, testing, and deployment (CD/continuous testing) pipelines and advanced visualization techniques to manage changes safely and effectively.

### 1.1 Program Comprehension
Program comprehension is the process of acquiring a working knowledge of a software system's structure and behavior. Studies show that maintainers spend up to half of their time understanding code:
- **Cognitive Models**: Diagrams and documentation help, but engineers build mental models of the software using top-down strategies (starting from high-level goals and mapping to code structures) and bottom-up strategies (reading lines of code and grouping them into functional abstractions).
- **Control and Data Flow Tracing**: Maintainers trace how control is passed between methods (call graphs) and how data is modified across variables to understand the execution state space.
- **Mental Mapping**: Bridging the gap between the application domain (user-facing concepts) and the programming domain (source code components, functions, and data structures).

### 1.2 Software Reengineering
Reengineering is the examination and alteration of a system to reconstitute it in a new form:
- **Refactoring**: Modifying the internal structure of code (such as simplifying conditionals, removing duplication, and improving naming) without changing its external behavior. Refactoring is essential for managing technical debt and maintaining code readability.
- **Code Translation and Architectural Migration**: Porting code to a modern programming language or migrating the system architecture (e.g., from a monolith to microservices) to improve scalability and maintainability.
- **Data Reengineering**: Restructuring databases, normalizing tables, and migrating schemas to support new system shapes while ensuring data integrity.

### 1.3 Reverse Engineering
Reverse engineering is the process of analyzing a system to identify its components and interrelationships, creating representations at a higher level of abstraction:
- **Design Recovery**: Reconstructing architectural design models, database schemas, and data flow diagrams from source code and runtime behavior.
- **Program Slicing**: A technique that extracts the subset of program statements that affect or are affected by a specific variable at a particular execution point. Static slicing analyzes all possible execution paths, while dynamic slicing analyzes execution paths for a specific input.
- **Abstractions**: Building high-level abstractions from the physical source files, representing them as call graphs, control flow trees, and module dependency models.

### 1.4 Continuous Integration, Delivery, Testing, and Deployment
Automated pipelines are critical for reducing regression risk in software maintenance:
- **Continuous Integration (CI)**: Automating the compilation, linting, and unit testing of code changes as they are committed to version control.
- **Continuous Delivery and Testing (CD)**: Deploying changes to staging environments and executing comprehensive regression, integration, and performance test suites.
- **Continuous Deployment**: Safely automating release deployment to production, backed by automated rollback mechanisms to mitigate post-release failures.

### 1.5 Visualizing Maintenance
Visualization techniques help maintainers manage system complexity:
- **Dependency Graphs**: Visualizing relationships between classes, files, and modules to identify tightly coupled components.
- **Change History Maps**: Analyzing version control data to visualize hot spots—areas of the codebase that change frequently or are associated with high defect rates.

### 1.6 Static and Dynamic Analysis in Maintenance
Comprehending and validating legacy systems requires the combined use of static and dynamic analysis:
- **Static Analysis**: Evaluating source code without execution to identify design patterns, code smells, and security violations.
- **Dynamic Analysis**: Monitoring program execution under specific test inputs to verify memory usage, trace execution paths, and detect runtime anomalies.

### 1.7 Modularization and Dependency Management
To reduce modification side effects, maintainers must actively manage module boundaries:
- **Encapsulation**: Ensuring that module data structures are hidden behind clear public interfaces.
- **Decoupling**: Reducing dependencies between modules to ensure that changes to one component do not require cascading modifications across the system.

### 1.8 Cognitive Models of Program Understanding
Cognitive theories describe how developers parse existing repositories:
- **Letovsky Model**: Describes program comprehension as utilizing a knowledge base, a mental model (with hierarchical levels of abstraction), and an assimilation process that updates the model using code cues.
- **Soloway and Ehrlich Model**: Proposes that programmers use "programming plans" (patterns of code that achieve goals) and "rules of discourse" (conventions of coding style) to understand code.
- **Integrated Models**: Real-world comprehension combines top-down (domain-driven) and bottom-up (code-driven) strategies opportunistically, switching between them depending on code quality and developer experience.

### 1.9 In-Depth Program Slicing
Program slicing isolates specific computation flows:
- **Backward Slicing**: Computes all statements that could affect the value of a target variable at a given line. Useful for tracking down the source of calculation bugs.
- **Forward Slicing**: Computes all statements that could be affected by the value of a target variable at a given line. Useful for impact analysis to check what will break if a variable definition is modified.
- **Dynamic Slicing**: Evaluates the slice for a specific test case execution path, narrowing the subset of statements to simplify debugging under specific inputs.

### 1.10 Refactoring Refinements and Restructuring
Refactoring is an ongoing discipline in the maintenance phase to reduce technical debt:
- **Code Smells**: Identifying design flaws such as God Classes (classes with too many responsibilities), Long Methods, Feature Envy (modules accessing other classes' data excessively), and Shotgun Surgery (changes requiring modifications across multiple classes).
- **Restructuring Mechanics**: Implementing structured adjustments like Extract Method, Introduce Parameter Object, and Replace Conditional with Polymorphism.
- **Behavior Preservation**: Running automated regression test suites continuously during refactoring to guarantee zero functional deviations.

### 1.11 Syntactic and Semantic Knowledge Representation
Comprehending complex systems requires bridging syntactic knowledge (language-specific syntax, constructs) with semantic knowledge (functional capabilities, business logic, system structures):
- **Shneiderman's Theory**: Suggests that programmers represent knowledge hierarchically, where syntactic knowledge is volatile and language-dependent, while semantic knowledge is stable and transferrable.
- **Mental Mapping**: Maintainers map syntactic variables and functions in source code to semantic business operations in the application domain.

## 2. Compliance Checklist
- [ ] Were cognitive program comprehension strategies (top-down or bottom-up) applied to understand legacy system logic before modifications?
- [ ] Are code modifications refactored to simplify structures, remove duplication, and improve readability without changing external behavior?
- [ ] Was the software reengineered (such as code translation or architectural migration) when necessary to modernize obsolete elements?
- [ ] Did the team use reverse engineering techniques (such as design recovery) to reconstruct undocumented database schemas or architectures?
- [ ] Were static or dynamic program slicing techniques used to isolate the statements affecting specific variables during troubleshooting?
- [ ] Is every code change integrated into a continuous integration pipeline that automatically runs compilers, linters, and unit tests?
- [ ] Were comprehensive regression test suites executed in a staging environment to verify that modifications did not introduce defects?
- [ ] Is continuous delivery configured to automate release packaging, staging deployment, and integration testing?
- [ ] Did the deployment process include automated health checks and rollback mechanisms to recover from failed production releases?
- [ ] Were system dependency graphs generated and reviewed to identify and decouple highly coupled modules?
- [ ] Are change history maps and hot spot analysis utilized to guide refactoring schedules and focus code quality audits?
- [ ] Has traceability been maintained between reverse-engineered design models, source code, and validation tests?
- [ ] Did the reengineering team execute data migration checks to verify the integrity of databases before and after schema restructuring?
- [ ] Were dynamic slicing configurations validated with real-world inputs to isolate edge cases in complex system logic?
- [ ] Are test coverage baselines tracked within the CI pipeline to ensure that regression suites adapt to software modifications?
- [ ] Was static analysis executed on the modified files to check compliance with defined coding standards and security patterns?
- [ ] Were encapsulation checks performed to confirm that internal class structures remain hidden behind modular interfaces?
- [ ] Did the team apply cognitive models (like Soloway and Ehrlich's programming plans) to map the application domain to the programming domain?
- [ ] Were forward and backward slices calculated to assess impact before modifying shared configuration layers?
- [ ] Are code smells tracked and prioritized in the backlog to guide refactoring iterations?
- [ ] Was Shneiderman's theory of syntactic and semantic knowledge used to document the architecture mappings for legacy developers?`,
  description:
    "software maintenance techniques, program comprehension, cognitive models, top-down, bottom-up, reengineering, refactoring, reverse engineering, static slicing, dynamic slicing, continuous integration, delivery, deployment, testing, visualization",
  filename: "maintenance-techniques",
  trigger: "model_decision"
});
