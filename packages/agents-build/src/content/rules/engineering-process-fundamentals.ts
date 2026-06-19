import { defineRule } from "../../define.ts";

export const engineeringProcessFundamentals = defineRule({
  content: `# Software Engineering Process Fundamentals

## 1. Domain Theory and Conceptual Foundations
Software engineering processes represent the structured work activities that software engineers execute to design, build, test, operate, and maintain software systems. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 10, Section 1, the software engineering process must be understood not as an ad-hoc set of developer tasks, but as a systematic, disciplined, and quantifiable engineering practice. Unlike simple programming, which focuses on the act of writing code, software engineering process design addresses the broader lifecycle of the software product, ensuring that quality, schedule, predictability, and safety constraints are consistently met.

The software engineering process is rooted in conventional engineering baselines. In physical disciplines—such as civil, mechanical, chemical, or electrical engineering—processes are standardized and split between design and manufacturing. Software engineering requires a unique conceptual model to define process boundaries, inputs, outputs, controls, and enabling mechanisms.

### 1.1 Historical Evolution and Conventional Engineering Baselines
The systematic study of software engineering processes began in the late 1960s and early 1970s as a response to the "software crisis," where large-scale software projects routinely ran over budget, missed deadlines, and delivered unreliable products. In attempting to establish a disciplined approach to software development, early computer scientists and engineers analyzed conventional manufacturing and design disciplines to establish a baseline.

In conventional engineering, design and manufacturing are distinct phases:
- **Design Class**: This class of activities is highly creative, non-repetitive, and focused on creating the specifications (e.g., blueprints, circuit diagrams, chemical formulations) for a system.
- **Manufacturing Class**: This class of activities is highly repetitive, standardized, and focused on reproducing multiple identical physical units of the designed system (e.g., fabricating thousands of microchips, assembling automobiles, or constructing physical chemical reactors).

In software engineering, the boundaries between design and manufacturing are different:
- **Software Design**: The vast majority of the software development lifecycle, including writing source code, designing database schemas, defining APIs, and structuring system architectures, falls into the design class. Unlike physical engineering where design ends before manufacturing begins, software design is an ongoing, evolutionary activity that continues throughout the life of the system.
- **Software Manufacturing**: The reproduction of software units is trivial and automated (e.g., copying files, distributing binaries via network protocols, or deploying containers). However, the term "manufacturing" is conceptually useful to describe the need to build, compile, bundle, and package the numerous distinct software units that comprise a complete software system. Software compilation, automated linking, and package assembly are the digital equivalents of manufacturing.

Furthermore, conventional engineering operations transform physical materials, energy, and entities. In software engineering, the operations phase is represented by the execution of a software unit (such as a query, an API call, or a background process) that transforms digital data. This distinction is critical: the software process refers to the work activities conducted by engineers, whereas software execution refers to the machine operations that perform data transformation.

### 1.2 Core Process Definitions: Processes, Activities, and Tasks
To enable process improvement, the software engineering community has standardized key terminology through frameworks like ISO/IEC/IEEE 12207. A software process is decomposed into a hierarchy of activities and tasks:
1. **Process**: A set of interrelated or interacting activities that transforms inputs into outputs to deliver an intended result. A process is defined by its purpose, outcomes, and operating conditions, such as requirements elicitation, configuration management, or testing.
2. **Activity**: A set of cohesive tasks of a process. Activities group related tasks that contribute to a major milestone. For example, in the testing process, activities include test planning, test case design, and test execution.
3. **Task**: A required, recommended, or permissible action intended to contribute to the achievement of process outcomes. Tasks represent the smallest atomic units of work, defining who performs the action, the required resources, and the specific steps.

Every process description must specify three primary elements:
- **Inputs**: The incoming information, artifacts, or states required to initiate the process, such as requirements documents, change requests, or baseline source code.
- **Transforming Activities**: The work procedures, methods, and steps that manipulate, analyze, or transform the inputs.
- **Outputs**: The resulting artifacts, data, or state changes. Examples include compiled binaries, test logs, or updated configuration records. Because processes are interrelated, the output of one process (e.g., an architecture design document) frequently serves as the direct input to another process (e.g., software construction).

### 1.3 Process Constraints: Controls and Enabling Mechanisms
Processes are constrained by external factors and supported by internal capabilities, categorized by SWEBOK v4 as:
- **Controls**: The directives, constraints, policies, and quality gates that govern process execution. Controls define the boundaries of acceptable process behavior. Examples include service level agreements (SLAs), safety standards (e.g., IEEE, ISO), coding guidelines, architectural constraints, and code review gates. Controls specify what must be achieved and how compliance is verified.
- **Enabling Mechanisms**: The tools, technologies, and infrastructure that facilitate process execution, providing the means to carry out activities predictably. Examples include:
  - **Workforce**: The skilled engineering personnel, roles, and structures performing the tasks.
  - **Tools**: Development tools, compilers, static analyzers, and test execution environments.
  - **Infrastructure**: Version control hosting, cloud pipelines, and compute resources.
  - **Methods**: Practices like test-driven development and continuous integration.

### 1.4 Project Context and Interdisciplinary Relations
Software engineering processes are performed within the context of a project. A project is a temporary endeavor with defined start and finish criteria undertaken to create a product or service in accordance with specified resources. Project management is governed by Software Engineering Management, which coordinates technical processes to meet project objectives within constraints.

The software process is interdisciplinary and relies on feedback loops between:
- **Software Requirements**: Providing the primary inputs that drive design and construction.
- **Software Architecture**: Establishing the structural constraints that govern construction.
- **Software Quality**: Defining the quality gates and assurance processes that act as controls.
- **Software Testing**: Validating that the outputs conform to the specified requirements.
- **Software Configuration Management**: Controlling and auditing artifacts throughout their lifecycle.
- **Engineering Foundations**: Applying measurement and root cause analysis to monitor performance.

No single process fits all projects. Processes must be selected, adapted, and tailored to the specific context, team size, safety criticality, and technology stack. This adaptation must be supported by empirical measurement to monitor and optimize performance based on quantitative data.

## 2. Compliance Checklist
- [ ] Has the software engineering process been clearly defined as a set of interrelated activities that transform inputs into outputs?
- [ ] Are all processes decomposed into cohesive activities, and are those activities further broken down into actionable, atomic tasks?
- [ ] Have the required inputs and expected outputs for each process phase been explicitly documented and communicated to the team?
- [ ] Is the output of each process verified to meet the entry criteria and format requirements of any dependent downstream processes?
- [ ] Have the appropriate controls, including compliance policies, regulatory constraints, and quality gates, been established for each process?
- [ ] Are enabling mechanisms, such as compiler utilities, static analyzers, and test execution runners, configured and available to support the work?
- [ ] Has the process been adapted and tailored to align with the specific constraints, risk profile, and goals of the current project context?
- [ ] Are empirical measurements and statistical metrics gathered systematically to monitor process performance and identify bottlenecks?
- [ ] Is the execution of the software process linked to defined project start and finish criteria, ensuring clear boundaries and objectives?
- [ ] Are interdisciplinary feedback loops between requirements, architecture, construction, quality, and testing actively monitored and maintained?
- [ ] Has the distinction between process activities (human work) and system execution (machine data transformation) been maintained in process documents?
- [ ] Are process improvement decisions based on empirical evidence, root cause analysis, and quantitative metrics rather than anecdotal feedback?
- [ ] Have the roles, responsibilities, and skillset requirements for the engineering workforce been mapped to the defined process tasks?
- [ ] Is the software configuration management process used to control, track, and audit all process inputs and outputs throughout their lifecycle?`,
  description:
    "software engineering process fundamentals, introduction, definitions, activities, tasks, controls, enabling mechanisms",
  filename: "engineering-process-fundamentals",
  trigger: "model_decision"
});
