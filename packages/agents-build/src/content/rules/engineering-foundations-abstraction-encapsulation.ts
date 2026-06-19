import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringFoundationsAbstractionEncapsulation = defineRule({
  content: [
    {
      level: 1,
      text: "Engineering Foundations - Abstraction, Encapsulation, and Hierarchy",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: 'In software engineering and system design, abstraction, encapsulation, and hierarchy are the foundational cognitive and structural mechanisms used to manage complexity. Complex engineering systems often involve millions of lines of code, hundreds of hardware modules, and intricate data communication flows. Human cognitive capacity, however, is limited by what psychologist George Miller termed "The Magical Number Seven, Plus or Minus Two"—the number of informational chunks an individual can hold in working memory at one time. To build reliable systems that exceed this cognitive limit, engineers must partition systems, hide unnecessary details, and organize components into structured relationships. These concepts are defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 18, Section 3, as the primary techniques for framing engineering problems and formulating sustainable design solutions.',
      type: "text"
    },
    {
      level: 3,
      text: "3.1 The Nature and Purpose of Abstraction",
      type: "header"
    },
    {
      text: "Abstraction is both the process and the result of generalization. It involves systematically reducing the information about a concept, problem, or observable phenomenon to focus on the essential properties that are relevant to the current level of analysis. In the words of design theorist Gerard Voland, abstraction allows engineers to view a problem and its possible solution paths from a higher level of conceptual understanding. This perspective enables designers to recognize relationships between seemingly disparate aspects of a system, fostering creative and robust design solutions.",
      type: "text"
    },
    {
      text: "A common misconception is that abstraction means being vague or imprecise. On the contrary, computer scientist Edsger W. Dijkstra famously stated that the purpose of abstracting is not to be vague, but to create a new semantic level in which one can be absolutely precise. For example:",
      type: "text"
    },
    {
      items: [
        {
          text: "In computer hardware design, a transistor is abstracted as a binary logic gate."
        },
        {
          text: "In software systems, physical memory addresses are abstracted as variables and objects."
        },
        {
          text: "In network communications, complex electrical signals and packet routing are abstracted as application-layer API calls."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "At each of these semantic levels, the engineer operates with absolute precision, utilizing formal syntax and rules specific to that level, while ignoring the complex physical or logical details that lie beneath.",
      type: "text"
    },
    {
      level: 3,
      text: "3.2 Levels of Abstraction and Standard Interfaces",
      type: "header"
    },
    {
      text: 'When abstracting a system, engineers concentrate on one "level" of the big picture at a time. This focus is made possible by standard interfaces, such as Application Programming Interfaces (APIs), hardware registers, or network protocols. An interface is a formal contract that defines the inputs, outputs, and permissible operations of a component, while hiding the underlying implementation.',
      type: "text"
    },
    {
      text: "Standard interfaces provide critical engineering advantages:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Portability**: Code written against a standard interface can run on different hardware or software platforms without modification."
        },
        {
          text: "**Integration**: Decoupled components can be integrated easily as long as they adhere to the same interface contracts."
        },
        {
          text: "**Wider Usage**: Well-defined interfaces enable reuse, allowing components to be shared across multiple projects."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Operating at a specific level of abstraction does not mean having zero knowledge of neighboring levels. Engineers must understand how their level interacts with the levels immediately above and below to prevent performance bottlenecks, security vulnerabilities, or resource leaks.",
      type: "text"
    },
    {
      level: 3,
      text: "3.3 Encapsulation as an Information Hiding Mechanism",
      type: "header"
    },
    {
      text: "Encapsulation is the primary mechanism used to implement and enforce abstraction. While abstraction represents the conceptual boundary, encapsulation represents the physical or logical container that seals that boundary. Encapsulation hides the internal details of a component—such as its data structures, algorithms, and state variables—behind a public interface.",
      type: "text"
    },
    {
      text: "By enforcing information hiding, encapsulation ensures that:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Implementation Independence**: The internal representation of a component can be refactored, optimized, or completely replaced without affecting its consumers, provided the public interface remains unchanged."
        },
        {
          text: "**State Protection**: A component's internal state can only be modified through authorized operations, preventing external modules from corrupting its data or violating system invariants."
        },
        {
          text: "**Decoupling**: The afferent and efferent coupling between modules is minimized, reducing the risk of regression cascades where a change in one file breaks unrelated parts of the system."
        }
      ],
      type: "numberedList"
    },
    {
      text: 'A failure in encapsulation leads to "leaky abstractions," where internal implementation details escape through the interface, forcing consumer modules to adapt to those details and re-introducing coupling.',
      type: "text"
    },
    {
      level: 3,
      text: "3.4 Hierarchical Structures and Task Decomposition",
      type: "header"
    },
    {
      text: "When system design involves multiple abstractions, they are typically organized into a hierarchy. SWEBOK v4 defines a hierarchy as a structured arrangement of abstraction levels. Hierarchies are classified by their structural topology:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Sequential Hierarchy**: Each layer has exactly one predecessor (lower) layer and one successor (upper) layer, except for the topmost and bottommost layers."
        },
        {
          text: "**Tree Hierarchy**: Each layer can have multiple predecessor layers but only one successor layer. This model is common in task decomposition, where a system is continuously divided into smaller subtasks."
        },
        {
          text: "**Many-to-Many Hierarchy**: A network structure where each layer can have multiple predecessor and successor layers."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Regardless of the topology, a valid hierarchy must never contain loops (cyclic dependencies). Cyclic dependencies introduce tight coupling, making components impossible to test or deploy independently. Hierarchical task analysis decomposes large organizational goals into subgoals, subtasks, and leaf-level operations, creating a clear division of labor and system responsibility.",
      type: "text"
    },
    {
      level: 3,
      text: "3.5 Alternate Abstractions and Complementary Views",
      type: "header"
    },
    {
      text: "For complex systems, a single hierarchical abstraction is rarely sufficient. Engineers must maintain multiple alternate abstractions at the same level of detail to capture different perspectives of the system. ",
      type: "text"
    },
    {
      text: "For example, a software system can be modeled simultaneously using:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Class Diagrams**: Capturing the static, structural relationships between objects."
        },
        {
          text: "**Statecharts**: Describing the dynamic, event-driven behavior of a component over time."
        },
        {
          text: "**Sequence Diagrams**: Detailing the runtime interaction and message flow between modules."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "These alternate views do not form a hierarchy; instead, they complement each other to provide a complete understanding of the system. The primary engineering challenge with alternate abstractions is synchronization. If one diagram is updated while the others are neglected, the models drift, leading to conflicting specifications and design errors.",
      type: "text"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Semantic Precision Review**: Has each level of abstraction been defined with a clear semantic vocabulary and precise operational rules, avoiding vague or undocumented behaviors?"
        },
        {
          text: "**Standard Interface Implementation**: Are all module boundaries mediated by standard, contract-based interfaces (such as APIs) to ensure portability and ease of integration?"
        },
        {
          text: "**Neighboring Layer Awareness**: Have the performance and security implications of the interactions between the current abstraction layer and its neighboring layers been evaluated?"
        },
        {
          text: "**Information Hiding Enforcement**: Are all internal data structures, state variables, and local algorithms encapsulated and hidden from external consumer modules?"
        },
        {
          text: "**State Invariant Protection**: Is the component's internal state protected against direct external modification, allowing changes only through public, validated methods?"
        },
        {
          text: "**Coupling and Cohesion Balance**: Has the design been analyzed to ensure high cohesion within modules and low coupling between modules?"
        },
        {
          text: "**Leaky Abstraction Prevention**: Have the public interfaces been audited to ensure that no internal implementation details (such as database schemas or platform-specific types) leak to consumers?"
        },
        {
          text: "**Hierarchical Integrity Check**: Is the structural relationship between system components organized in a clear, loop-free (acyclic) hierarchy?"
        },
        {
          text: "**Cyclic Dependency Auditing**: Have the package and module dependency graphs been audited to verify that no cyclic references exist?"
        },
        {
          text: "**Task Decomposition Alignment**: Has the system's execution logic been decomposed hierarchically into subtasks and functions that map to specific organizational goals?"
        },
        {
          text: "**Alternate Abstraction Mapping**: Are alternate modeling views (such as structural, behavioral, and interaction diagrams) used to document the system from different perspectives?"
        },
        {
          text: "**Model Synchronization Audit**: Is there a defined process or tooling in place to ensure that alternate abstractions remain synchronized when design changes occur?"
        },
        {
          text: "**Cognitive Load Optimization**: Does the design limit the number of components or concepts at any single level of abstraction to match human cognitive working memory limits?"
        },
        {
          text: "**API Contract Validation**: Are changes to public interfaces governed by a strict versioning and deprecation policy to protect downstream consumers?"
        },
        {
          text: "**Refactoring Safety Gate**: Are encapsulated modules backed by a comprehensive unit test suite, allowing internal implementation changes to be made safely?"
        },
        {
          text: "**Abstraction Level Consistency**: Does each layer of the system operate at a consistent level of abstraction, avoiding mixing high-level business logic with low-level platform details?"
        },
        {
          text: "**Reusability and Generalization Check**: Has the design been audited to identify components that can be generalized and extracted into reusable libraries?"
        },
        {
          text: "**Peer Interface Walkthrough**: Have the interface definitions and abstraction boundaries undergone a structured peer review by the design team before implementation?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "abstraction, encapsulation, hierarchy, standard interfaces, api design, information hiding, leaky abstractions, cyclic dependencies, task decomposition, alternate views",
  filename: "engineering-foundations-abstraction-encapsulation",
  trigger: "model_decision"
});
