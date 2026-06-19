import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const modelsMethodsTypes = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Models: Structural, Behavioral, and Information Models",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "In software engineering, a complete system model is typically constructed as an aggregation of submodels, each created for a specific purpose and providing a partial description of the system. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 11, these submodels leverage standardised notations to capture different aspects of the software's architecture and operation. The Unified Modeling Language (UML) and Systems Modeling Language (SysML) are widely used to construct these representations. Modeling diagrams are generally categorized into two primary types: structural models, which define the static composition and logical boundaries of the system, and behavioral models, which define the dynamic functions, executions, and state transitions. Additionally, information modeling provides a specialized structural perspective focused on data entities and their constraints. Together, these model types provide a complete blueprint that guides implementation, verification, and maintenance.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Structural Modeling and Composition",
      type: "header"
    },
    {
      text: "Structural models illustrate the physical or logical composition of a software system from its constituent parts. Structural modeling is essential for establishing the boundary between the software being implemented and the external environment. This boundary helps engineers define interfaces, assign responsibilities, and control coupling. Key concepts in structural modeling include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Composition and Decomposition**: Breaking the system down from high-level subsystems into lower-level modules, components, and classes."
        },
        {
          text: "**Generalization and Specialization**: Organising entities into inheritance hierarchies, where general properties are shared and specialized properties are defined in sub-entities."
        },
        {
          text: "**Relationships and Cardinality**: Identifying how entities associate with one another (e.g., dependency, aggregation, composition) and defining the multiplicity rules governing those associations."
        },
        {
          text: "**Interface Definition**: Specifying the programmatic and functional interfaces through which components interact, separating the interface definition from its concrete implementation."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "The UML provides a rich collection of diagrams for structural modeling:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Class Diagrams**: Map the logical static structure of the system, illustrating classes, attributes, operations, and their static associations."
        },
        {
          text: "**Component Diagrams**: Illustrate modular parts of the system, showing physical components, their interfaces, and dependencies."
        },
        {
          text: "**Object Diagrams**: Map class instances and their configurations at a specific point in time, helping analyze object state relationships."
        },
        {
          text: "**Deployment Diagrams**: Define the physical execution architecture, showing how software modules map to hardware nodes and environments."
        },
        {
          text: "**Packaging Diagrams**: Group logical model elements into namespaces, packages, and folders, showing dependencies between packages."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Information Modeling and Semantic Data Transformations",
      type: "header"
    },
    {
      text: "Information modeling is a specialized form of structural modeling that focuses exclusively on data entities, their properties, relationships, and constraints. An information model is an abstract representation that defines the concepts and business rules of the domain from a problem perspective, without concern for how the data is physically stored or manipulated.\nThis modeling process typically undergoes three phases of translation:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Conceptual/Semantic Information Model**: A high-level abstraction representing real-world business entities and logical relationships. It includes only the properties and constraints needed to conceptualize the domain."
        },
        {
          text: "**Logical Data Model**: An intermediate representation that maps conceptual entities to a logical structure (such as relational tables, document schemas, or graph nodes) independent of a specific database management system."
        },
        {
          text: "**Physical Data Model**: The final implementation model, which defines how data is physically stored, including database tables, columns, indexes, data types, primary/foreign keys, and constraints."
        }
      ],
      type: "numberedList"
    },
    {
      text: "This structured transformation ensures that data requirements are thoroughly validated against business needs before physical implementation begins, preventing costly database schema refactorings.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Behavioral Modeling and Dynamic Execution",
      type: "header"
    },
    {
      text: "Behavioral models identify and define the dynamic functions and execution paths of the software. They describe how the system responds to internal and external stimuli over time. Behavioral models generally take three basic forms:",
      type: "text"
    },
    {
      items: [
        {
          text: "**State Machines**: These models represent the software as a collection of discrete states, events, and transitions. The system transitions from one state to another in response to triggering events, which can be guarded by conditional assertions. State machines are critical for modeling reactive, event-driven, or protocol-based systems."
        },
        {
          text: "**Control-Flow Models**: These models depict the sequence in which operations and processes are activated or deactivated, illustrating the execution control logic."
        },
        {
          text: "**Data-Flow Models**: These models represent the movement of data through a sequence of processing steps, tracing data from sources (data inputs) through transformations (processes) to repositories (data stores) or destinations (data sinks)."
        }
      ],
      type: "numberedList"
    },
    {
      text: "Behavioral models incorporate time concepts to characterize execution, which can represent logical time (logical ordering of events), physical time (actual clock duration), discrete time (sampled intervals), continuous time, relative time, or absolute time. The UML supports behavioral modeling through several diagrams:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Use Case Diagrams**: Capture actor-system boundaries and high-level requirements."
        },
        {
          text: "**Activity Diagrams**: Model workflow control and parallel execution paths (forks and joins)."
        },
        {
          text: "**State Machine Diagrams**: Model event-triggered state changes and transition guards."
        },
        {
          text: "**Interaction Diagrams**: Map message exchanges, including sequence diagrams (emphasizing temporal order), communication diagrams (emphasizing structural relations of objects), timing diagrams (emphasizing exact time constraints), and interaction overview diagrams (summarizing control flows)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 SysML Requirements and Parametric Models",
      type: "header"
    },
    {
      text: "While UML is standard for software-centric modeling, the Systems Modeling Language (SysML) extends these concepts to support systems engineering. SysML introduces two additional model types:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Requirements Models**: Requirements models represent textual requirements as model elements, allowing engineers to establish direct traceability relationships between requirements and the structural or behavioral components that satisfy them."
        },
        {
          text: "**Parametric Models**: Parametric models express quantitative constraints (such as performance, reliability, physical mass, or thermal limits) as mathematical equations associated with structural blocks. These models enable automated execution and analysis of system performance parameters, helping verify that design choices satisfy constraints."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "In systems engineering practice, integrating SysML models with software-centric UML diagrams is standard. This integration ensures that system-level hardware constraints and operational requirements propagate directly to software component designs, maintaining architectural alignment and design consistency across the entire hardware-software boundary.",
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
          text: "Has the system model been organized as an aggregation of cohesive submodels, each addressing a specific purpose?"
        },
        {
          text: "Are structural models utilized to define the static, physical, or logical composition of the software components?"
        },
        {
          text: "Does structural modeling establish a clear boundary between the software system and its operating environment?"
        },
        {
          text: "Were composition and decomposition techniques systematically applied to break down complex subsystems?"
        },
        {
          text: "Are generalization and specialization hierarchies modeled correctly to represent entity relationships?"
        },
        {
          text: "Has the cardinality and multiplicity of all relations between structural entities been explicitly defined?"
        },
        {
          text: "Are functional and programmatic interfaces modeled to separate component definitions from implementation details?"
        },
        {
          text: "Have appropriate UML structural diagrams (class, component, object, deployment, packaging) been selected to represent the static architecture?"
        },
        {
          text: "Was an information model constructed to identify data concepts, properties, relations, and constraints from the problem perspective?"
        },
        {
          text: "Did the data design undergo a systematic transformation from a conceptual semantic model to a logical model, and finally to a physical data model?"
        },
        {
          text: "Are behavioral models constructed to define the dynamic functions, workflows, and execution characteristics of the software?"
        },
        {
          text: "Is the software's reactive behavior represented using state machines with defined states, events, transitions, and guard conditions?"
        },
        {
          text: "Do control-flow models illustrate the activation and deactivation sequences of system processes?"
        },
        {
          text: "Do data-flow models trace data from sources through transformation processes to data stores and sinks?"
        },
        {
          text: "Are time concepts (logical, physical, discrete, continuous, relative, or absolute time) explicitly defined in the behavioral models?"
        },
        {
          text: "Have appropriate UML behavioral diagrams (use case, activity, state machine, interaction) been utilized to capture system dynamics?"
        },
        {
          text: "In systems engineering contexts, are SysML requirements models used to link textual requirements to design elements?"
        },
        {
          text: "Are SysML parametric models utilized to verify quantitative system constraints and performance equations?"
        },
        {
          text: "Did the team verify that all structural and behavioral submodels are consistent with one another and share unified naming conventions?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software design, structural modeling, class, component, object, deployment, packaging, information modeling, conceptual, logical, physical data models, behavioral modeling, state machines, control-flow, data-flow, SysML requirements, parametric models",
  filename: "models-methods-types",
  trigger: "model_decision"
});
