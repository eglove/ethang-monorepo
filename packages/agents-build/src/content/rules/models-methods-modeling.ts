import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const modelsMethodsModeling = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Models: Modeling Principles and Expression",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Modeling is a core discipline within Software Engineering Models and Methods, as defined by the IEEE Software Engineering Body of Knowledge (SWEBOK v4). It imposes structure on the software engineering process, enabling engineers to solve problems, represent abstractions, and communicate design decisions to stakeholders. A software model is not a complete depiction of a system; rather, it is a simplified abstraction designed to answer specific questions, explore constraints, and validate assumptions. By abstracting away non-essential information, engineers keep models manageable and focus attention on the core complexities of the system under study. This simplification is guided by three fundamental modeling principles: modeling the essentials, providing perspective, and enabling effective communication. Models serve as the foundation for subsequent construction, testing, and evolution activities, making their syntactic and semantic integrity essential for project success.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Unifying Modeling Principles",
      type: "header"
    },
    {
      text: "Three general principles guide all software modeling activities, regardless of the specific notation or tooling used:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Model the Essentials**: Models should focus strictly on the aspects of the software that address specific engineering questions or risks. Attempting to represent every detail under every possible condition results in overly complex, unmaintainable models that obscure critical details. Practical software models represent only what is needed to make informed decisions. A model is an abstraction or simplification of a system; because no single abstraction can completely describe a software component, the software model comprises an aggregation of abstractions which, when taken together, describe selected aspects, perspectives, or views needed to respond to the reasons for creating the model in the first place."
        },
        {
          text: "**Provide Perspective**: Because no single view can capture all aspects of a complex software system, modeling uses a perspective-driven approach. Organizing information into distinct views—such as structural, behavioral, temporal, or organizational views—allows engineers to address specific concerns in isolation. Each view utilizes appropriate notations and vocabularies to describe the system from a specific dimension. This perspective-driven approach provides dimensionality to the model, focusing the software modeling efforts on specific concerns relevant to that view using the appropriate notation, vocabulary, methods, and tools."
        },
        {
          text: "**Enable Effective Communications**: Modeling must use the vocabulary of the application domain and follow a rigorous, standardized modeling language. This allows different stakeholder groups (including end-users, buyers, developers, architects, and certifying authorities) to share a common understanding of the system's structure and behavior. Rigorous syntax and clear semantics prevent misunderstandings and provide a formal basis for system validation. When used rigorously and systematically, modeling results in a reporting approach that facilitates effective communication of software information to project stakeholders."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Contextual Assumptions and Model Reuse",
      type: "header"
    },
    {
      text: "The simplified nature of models introduces inherent assumptions about the operational and environmental context in which the model is placed. These assumptions are critical to document and validate. If a model is reused in a different project or environment, these contextual assumptions must be validated first to establish the relevancy of the reused model within its new use and context. Bypassing this validation step often introduces hidden integration risks, as the design constraints, interface assumptions, or operational profiles of the target environment may differ significantly from the model's source environment.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Expression, Syntax, Semantics, and Pragmatics",
      type: "header"
    },
    {
      text: "The construction and interpretation of software models are governed by three levels of language theory: syntax, semantics, and pragmatics.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Syntax**: Syntax defines the rules and grammar for constructing valid models. For textual modeling languages, syntax is defined using formal grammars such as Backus-Naur Form (BNF). For graphical modeling languages, syntax is defined using metamodels. Metamodels are themselves graphical models that specify the valid entities (e.g., classes, states, actors) and relationships (e.g., associations, transitions, dependencies) that can be composed to form a valid model. Metamodels establish the rules of composition, ensuring that graphical diagrams are syntactically well-formed."
        },
        {
          text: "**Semantics**: Semantics specifies the precise meanings attached to the entities and relations within a model. A simple diagram showing two entities connected by a line is ambiguous without semantic context; knowing whether the diagram is a class diagram, a sequence diagram, or an activity diagram defines the runtime meaning of the connection. Semantics ensures that the model can be interpreted consistently by tools and engineers."
        },
        {
          text: "**Pragmatics**: Pragmatics explains how meaning is communicated effectively within a specific project context. It addresses how modelers apply notation to make models readable, understandable, and useful to other engineers. This includes following layout conventions, selecting intuitive names, and documenting assumptions."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Semantic Assumptions, Library Reuse, and Software Evolution",
      type: "header"
    },
    {
      text: "When reusing submodels, templates, or components from external libraries, engineers must exercise caution regarding hidden semantic assumptions. Although the imported syntax may be identical to the target environment, the entities may carry assumptions that conflict with the new context. For example, an imported communication protocol model might assume a synchronous network interface, which violates the asynchronous nature of the host environment.\nFurthermore, as software matures and undergoes modifications, semantic discord can be introduced. Over time, as multiple engineers edit different portions of a model and tools are updated, the model can drift from its original intent. Documenting design assumptions and maintaining strict configuration control are essential to prevent semantic drift and ensure the long-term correctness of the model.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Preconditions, Postconditions, and Invariants",
      type: "header"
    },
    {
      text: "When modeling functions, methods, or state transitions, software engineers use formal assertions to define the boundaries of correct execution. These assertions represent assumptions about the system state before, during, and after execution:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Preconditions**: Preconditions are constraints that must be satisfied before a function or method begins execution. If these conditions are violated, the function's behavior is undefined and may produce erroneous results or system failures. Preconditions define the contract that the caller must satisfy."
        },
        {
          text: "**Postconditions**: Postconditions are guarantees that must be true after the function or method has executed successfully. They describe how the system state, data values, parameters, and return values have been modified. Postconditions define the contract that the function promises to deliver."
        },
        {
          text: "**Invariants**: Invariants are conditions within the operational environment that must persist without change before, during, and after execution. Invariants represent fundamental truths about the system's state or data integrity that must be preserved by all operations."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "Are all modeling activities guided by the three fundamental principles: modeling the essentials, providing perspective, and enabling communication?"
        },
        {
          text: "Does the model focus strictly on abstracting the essential characteristics needed to answer specific engineering questions?"
        },
        {
          text: "Are multiple, distinct views (such as structural, behavioral, and temporal) used to provide comprehensive perspectives of the software?"
        },
        {
          text: "Have the target stakeholders (including users, buyers, architects, developers, and evaluators) been identified and their communication needs addressed in the model design?"
        },
        {
          text: "Does the model utilize the standardized vocabulary of the application domain to ensure effective semantic expression?"
        },
        {
          text: "Are the syntactic rules of the modeling language formally defined, using Backus-Naur Form (BNF) for textual languages or metamodels for graphical languages?"
        },
        {
          text: "Are graphical modeling components composed strictly in accordance with the rules defined in the language's metamodel?"
        },
        {
          text: "Has the semantic meaning of all entities, shapes, relations, and textual attributes been clearly specified and documented?"
        },
        {
          text: "Are the pragmatics of the model addressed to ensure that information is presented in a readable, intuitive, and contextually appropriate manner?"
        },
        {
          text: "Were all imported submodels, libraries, and external templates audited for conflicting semantic assumptions before integration?"
        },
        {
          text: "Is there a configuration control process in place to prevent semantic discord and drift during multi-engineer model modifications?"
        },
        {
          text: "Have explicit preconditions been defined and documented for all key software functions, methods, and transitions?"
        },
        {
          text: "Are postconditions explicitly defined to guarantee the expected state changes and return values upon successful execution?"
        },
        {
          text: "Have invariants been identified and verified to ensure that critical operational environmental conditions remain unchanged?"
        },
        {
          text: "Are assertions (preconditions, postconditions, invariants) systematically verified through static analysis, simulation, or runtime checks?"
        },
        {
          text: "Does the modeling effort document all contextual assumptions to allow validation prior to model reuse in a different environment?"
        },
        {
          text: "Are model entities connected using valid relations that adhere strictly to the cardinality and syntax of the modeling language?"
        },
        {
          text: "Has a process been established to review and update model documentation whenever the underlying requirements or software structures mature?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software design models, structural, behavioral, temporal, modeling principles, abstraction, syntax, semantics, pragmatics, metamodels, preconditions, postconditions, invariants",
  filename: "models-methods-modeling",
  trigger: "model_decision"
});
