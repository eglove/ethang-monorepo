import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringFoundationsModelingSimulation = defineRule({
  content: [
    {
      level: 1,
      text: "Engineering Foundations - Modeling, Simulation, and Prototyping",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Modeling, simulation, and prototyping are advanced abstraction techniques used by software engineers to conceptualize, analyze, and validate system structures, behaviors, and design decisions. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 18, Section 6, these techniques allow engineers to explore alternative designs, predict system behaviors under different scenarios, and elicit user feedback before committing to full-scale software construction. By creating simplified representations of reality, engineers can identify design defects early, reducing the cost of software quality and preventing structural errors in the final product.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Modeling Concepts and Typologies",
      type: "header"
    },
    {
      text: "A model is a simplified abstraction of a real or imagined artifact. In software engineering, modeling serves as a critical bridge between requirements elicitation and system construction, acting as a language-based representation of the system. Models help engineers determine what is known and what remains unknown about a system, allowing them to focus on specific architectural views or behaviors while ignoring irrelevant details. SWEBOK v4 classifies models into three distinct categories based on their level of abstraction and representation style:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Iconic Models**: Visually equivalent but incomplete representations of physical artifacts. Iconic models physically resemble the item they represent, typically using a different scale. Examples in physical engineering include scale models of bridges or highways. In software engineering, iconic models are less common due to the non-physical nature of software, but they are realized through visual user interface mockups, screen wireframes, and physical hardware deployment diagrams that visually map the placement of servers and network cables."
        },
        {
          text: "**Analogic Models**: Functionally equivalent but incomplete representations. While an analogic model behaves like the target system, it does not physically resemble it. Examples include using wind tunnel mockups to simulate aerodynamic behaviors, or using electrical circuits to model heat transfer. In software engineering, analogic models are frequently used to study system dynamics. For instance, a queue-based process flow model is used to simulate message broker operations under heavy traffic, or a bucket-brigade model is used to study task handoffs in a development pipeline. The analogic representation behaves mathematically like the software system, allowing performance analysis without requiring real implementation code."
        },
        {
          text: "**Symbolic Models**: The highest level of abstraction, representing a system or process using formal symbols, equations, logical expressions, or mathematical relationships. An example from classical physics is Newton's equation F = ma. In software engineering, symbolic models are widespread and include formal specification languages, finite state machines (which model transition states mathematically), context-free grammars (modeling language syntax), UML class structures, sequence diagrams, and mathematical expressions representing algorithmic complexity (such as Big-O notation). Symbolic models allow developers to mathematically reason about correctness, completeness, and performance boundaries."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Simulation Principles and the Initialization Problem",
      type: "header"
    },
    {
      text: "Simulation uses a model of a system to conduct designed experiments, allowing engineers to study the behavior of the system, analyze subsystem interactions, and validate design alternatives.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Discrete vs. Continuous Simulation**: Simulations are classified by the nature of the system under study. Continuous simulations model systems that change continuously over time, using differential equations (such as fluid dynamics or thermal flow). Discrete simulations model systems where state changes occur at discrete points in time, triggered by specific events. Software engineering primarily focuses on discrete simulations—specifically discrete-event simulation (DES)—where events are processed chronologically to model transaction flows, server scheduling, and database query executions."
        },
        {
          text: "**Key Components of Discrete Simulation**: A discrete simulation model contains several essential elements:\n- **Entities**: The items or objects flowing through the system, possessing attributes that track their properties (e.g., network packets, database queries, or user requests).\n- **Activities and Events**: Processes that consume time (activities) and occurrences that change the state of the system at specific moments (events).\n- **Resources**: The assets required by entities to perform activities, characterized by defined capacities (e.g., CPU cycles, thread pools, or database connections).\n- **system State**: The collection of state variables that describe the system at any given point in time (e.g., queue lengths, busy resources, or wait times).\n- **Simulation Clock**: A mechanism to track the progression of simulation time, advancing from one event to the next.\n- **Random Number Generator**: Used to introduce probabilistic variability into arrival rates, service times, and decision paths, typically using Monte Carlo sampling."
        },
        {
          text: "**The Initialization Problem**: A critical challenge in discrete simulation is determining the initial values of all state variables before running the simulation. Since the true initial conditions are often unknown, designers often choose arbitrary start states, such as initializing all queues as empty and idle. This arbitrary initialization can introduce significant initialization bias, skewing the simulation's outputs. To mitigate this bias, engineers must establish a warm-up period during which data is discarded, allowing the simulation to reach a steady-state before measuring outcomes. Engineers can use graphical heuristics (such as Welch's method) or statistical convergence checks to determine when the transient phase has ended."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Prototyping in Physical and Software Engineering",
      type: "header"
    },
    {
      text: "Prototyping is another abstraction process where a partial, tangible representation of the product is constructed. While modeling focuses on conceptual representation, prototyping focuses on feasibility testing and validation.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Objectives**: Prototyping serves several critical engineering purposes:\n- **Requirements Elicitation**: Helping stakeholders visualize and clarify their operational needs.\n- **User Interface Design**: Refining the aesthetics and ergonomics of user interactions.\n- **Functional Validation**: Testing the technical feasibility of complex algorithms or integrations."
        },
        {
          text: "**Software Prototyping Strategies**:\n- **Throwaway (Rapid) Prototyping**: Designed to be discarded after learning. Used primarily to clarify ambiguous requirements, test UI layouts, or investigate isolated technologies. Once the requirements are clarified, the code is discarded, and the system is rebuilt from scratch with proper architecture.\n- **Evolutionary Prototyping**: Designed to gradually grow into the final production system. This requires rigorous architectural design from the outset to avoid structural decay, as the prototype code will eventually be deployed.\n- **Horizontal Prototyping**: Focuses on broad functional scope but lacks depth, representing a wide range of user interface screens with hardcoded navigation but no business logic or database integration.\n- **Vertical Prototyping**: Focuses on a narrow functional slice but implements it in full depth, connecting a specific user interface feature to a live database through a completed security layer to test integration feasibility."
        },
        {
          text: "**Physical vs. Software Prototyping**: In physical engineering, a prototype is often the first fully functional version of the system. In software engineering, prototypes are abstract models of part of the software, and they are usually built by sacrificing key quality attributes (such as architectural scalability, security controls, error handling, and performance optimization) to focus on functional feasibility. Because of these compromises, software prototypes must be planned, monitored, and controlled to serve a clear, limited purpose. If prototype shortcuts are carried into production without strict refactoring, they introduce permanent technical debt and security risks."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Modeling, Simulation, and Prototyping Compliance Checklist",
      type: "header"
    },
    {
      text: "This checklist defines SWEBOK-derived criteria for verifying the quality and methodology of modeling, simulation, and prototyping activities:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Model Abstraction Level**: Is the model clearly classified (iconic, analogic, or symbolic), and is the level of abstraction appropriate for the design concern?"
        },
        {
          text: "**Simplification Assumptions**: Are all simplifications, omissions, and assumptions made during model construction explicitly documented?"
        },
        {
          text: "**Simulation Type Selection**: Is the choice between discrete and continuous simulation aligned with the behavioral characteristics of the target system?"
        },
        {
          text: "**Discrete Component Identification**: In discrete simulations, are all entities, activities, events, resources, and state variables clearly mapped?"
        },
        {
          text: "**Initialization Bias Mitigation**: Is the simulation's initialization state documented, and is a warm-up period defined to mitigate initialization bias?"
        },
        {
          text: "**Random Number Verification**: Is the pseudo-random number generator verified for statistical independence and period length to ensure simulation validity?"
        },
        {
          text: "**Simulation Replications**: Are multiple replication runs conducted with different random seeds to establish statistical confidence intervals for the outputs?"
        },
        {
          text: "**Prototype Goal Definition**: Does the prototype have a clearly defined, documented objective (e.g., requirements elicitation vs. technical feasibility)?"
        },
        {
          text: "**Quality Compromise Documentation**: Are the specific quality attributes (e.g., security, scalability) sacrificed in the software prototype documented?"
        },
        {
          text: "**Prototype Lifecycle Control**: Is the prototype's development planned, monitored, and controlled rather than built ad-hoc?"
        },
        {
          text: "**Disposition Strategy**: Is there a clear, pre-defined disposition plan for the prototype (e.g., throwaway prototype vs. evolutionary framework)?"
        },
        {
          text: "**Model-system Alignment**: Is the model or simulation validated against real-world empirical data to ensure it accurately represents the target system?"
        },
        {
          text: "**Subsystem Interaction Mapping**: Does the simulation model the relationships and dependencies between different subsystems?"
        },
        {
          text: "**Interface Consistency**: Do the simulated components interact using the same interface boundaries (APIs) defined in the system architecture?"
        },
        {
          text: "**Representational Completeness**: Does the model capture all relevant attributes of interest needed to make the design decisions under test?"
        },
        {
          text: "**Feedback Loop Integration**: Are the insights and validation results obtained from the prototype or simulation fed back into the requirements and design baselines?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "modeling, simulation, prototyping, iconic models, analogic models, symbolic models, discrete simulation, initialization problem, requirements elicitation, system behavior",
  filename: "engineering-foundations-modeling-simulation",
  trigger: "model_decision"
});
