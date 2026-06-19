import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const configurationIdentification = defineRule({
  content: [
    {
      level: 1,
      text: "Configuration Identification",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software Configuration Management (SCM) is an engineering discipline essential for managing the evolution of complex software systems. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 8, SCM comprises activities that identify, control, status-account, and audit the software configuration. Among these, Software Configuration Identification is the foundational activity that establishes control over the software development process. It involves identifying items to be controlled, establishing identification schemes for these items and their versions, and defining the tools and techniques to be used in acquiring and managing controlled items. These activities provide the critical basis for all other SCM activities. If configuration items are not properly identified and characterized, it is impossible to perform configuration control, status accounting, or auditing.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Identifying Items to Be Controlled",
      type: "header"
    },
    {
      text: "The first step in controlling change is identifying the specific software items to be controlled. This requires understanding the software configuration within the context of the overall system configuration, selecting Software Configuration Items (SCIs), and developing a strategy for labeling them. The system configuration encompasses all hardware, software, documentation, and external interfaces. Consequently, the software configuration must be understood in relation to these components to ensure change impacts are analyzed across boundaries. Selecting SCIs requires a balance between providing adequate visibility for project control and providing a manageable number of controlled items. Over-identifying SCIs leads to administrative overhead, while under-identifying them results in untraceable changes and a lack of baseline stability.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Software Configuration Items (SCIs)",
      type: "header"
    },
    {
      text: "A Configuration Item (CI) is an item or aggregation of hardware, software, or both, managed as a single entity. An SCI is a software entity established as a CI. SCM controls various items in addition to the code itself. Software items with potential to become SCIs include plans (development, quality assurance, and configuration management plans), specifications and design documentation (requirements, architecture designs, and database designs), testing materials (test plans, cases, data, and expected results), software tools (compilers, linters, and builder scripts), source and executable code, code libraries, data dictionaries, and documentation for installation, maintenance, operations, and end-user software use.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Configuration Item Identifiers and Attributes",
      type: "header"
    },
    {
      text: "Status accounting activities gather information about CIs during development. A configuration item scheme is defined to establish what information must be tracked for each CI: unique identifiers and versions. An example scheme includes attributes such as CI name, unique identifier, description, dates (creation, modification, and baseline), type, and owner. A CI's unique identifier can use significant or nonsignificant codification. Significant codification embeds descriptive metadata into the identifier itself (e.g., XX-YY, where XX is the iteration code and YY is the CI type). This helps developers quickly understand the context. Nonsignificant codification assigns arbitrary, unique sequential numbers or random UUIDs. While it conveys no context, it avoids naming conflicts and eliminates the need to update identifiers if an item's classification changes. Tracking attributes is essential for traceability across the product lifecycle, allowing engineers to associate specific code changes with requirements, bugs, or release packages.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Baseline Identification",
      type: "header"
    },
    {
      text: "A software baseline is a formally approved version of a CI, regardless of media type, formally designated and fixed at a specific time in its lifecycle. A baseline can be changed only through formal change control procedures. A baseline, with all approved changes to it, represents the current approved configuration and consists of one or more related CIs. Baselines provide a known, stable starting point for subsequent development steps, preventing team members from working with inconsistent versions. Example baseline attributes include the baseline name, unique identifier, description, creation date, and baseline CIs. These attributes are used in status accounting. SWEBOK v4 highlights common baselines:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Functional Baseline**: Established at the completion of the system requirements phase, specifying the functional requirements that the system must satisfy."
        },
        {
          text: "**Allocated Baseline**: Established after design, allocating requirements to specific hardware or software configuration items."
        },
        {
          text: "**Product Baseline**: Established at the completion of system integration and testing, representing the compiled, verified, and deliverable state of the software."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Relationships Scheme Definition",
      type: "header"
    },
    {
      text: "Relationships provide the connections required to create and sustain structure. The ability to communicate intent and manage development results is enhanced when effective relationships (structuring) are in place. The status accounting activity is responsible for gathering information about relationships among CIs. SWEBOK v4 defines several common relationship types:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Dependencies**: CIs depend mutually or one-way on each other (e.g., a class model depends on a sequence diagram because a change to either affects the other)."
        },
        {
          text: "**Derivation**: One CI derives from another sequentially due to a constraint requiring one CI to be completed before the other is developed (e.g., source code deriving from design specifications)."
        },
        {
          text: "**Succession**: Software items evolve. A version is an identified instance or state of an evolving item. The succession relationship reflects this evolutionary progression and is reflexive. The first succession occurs when a CI is created; subsequent changes create new successions, which is how versions are tracked."
        },
        {
          text: "**Variants**: Program versions resulting from engineered alternative options. Variants are less common because they are expensive to maintain."
        },
        {
          text: "**Software Bill of Materials (SBOM)**: A formal record containing the details and supply chain relationships of the CIs (components) used in building software. Components can be source code, third-party libraries, modules, open-source or proprietary, and free or paid. The SBOM provides deep transparency to monitor vulnerabilities and licensing compliance across the software supply chain."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Software Libraries and Security",
      type: "header"
    },
    {
      text: "A software library is a controlled collection of source code, scripts, object code, documentation, and related artifacts. SCM relies on libraries to enforce access control, segregation of duties, and release management. SWEBOK v4 highlights the transition of artifacts through a sequence of library environments: developer libraries (working spaces with minimal control), controlled libraries (staging or integration areas with automated testing and build checks), and formal libraries (production release areas with strict access rules). Requirements and test cases should be linked with the code baselines. Source code is stored in version control, providing traceability and security. Multiple development streams are supported in version control linked to binary objects derived during builds. Binary objects are typically stored in a repository containing cryptographic hashes to perform the physical configuration audit (PCA). The definitive media library contains release baselines of artifacts deployable to test, stage, and production systems. In terms of access control and backup facilities, security is a key aspect of library management. Proper access control ensures only authorized processes promote artifacts, while automated backups prevent data loss.",
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
          text: "**SCI Identification**: Are all relevant artifacts (plans, specifications, test materials, tools, source code, docs) selected as SCIs?"
        },
        {
          text: "**Visibility Balance**: Is there a documented balance in SCI selection to ensure manageable control without losing visibility?"
        },
        {
          text: "**System Context**: Is the software configuration defined and aligned within the context of the overall system configuration?"
        },
        {
          text: "**Standardized Identifier**: Does each SCI have a unique identifier using a documented significant or nonsignificant schema?"
        },
        {
          text: "**Attribute Tracking**: Does the SCM scheme track essential CI attributes (name, description, dates, type, owner) in status accounting?"
        },
        {
          text: "**Baseline Designation**: Are all baselines formally approved, designated, and associated with a specific date and time?"
        },
        {
          text: "**Baseline Attributes**: Are baseline attributes (name, identifier, description, creation date, CIs) recorded in status accounting?"
        },
        {
          text: "**Formal Baseline Gate**: Is there a check ensuring that once established, baselines can only be modified via formal change control?"
        },
        {
          text: "**Dependency Mapping**: Are dependency relationships among CIs mapped and tracked to analyze change impacts across modules?"
        },
        {
          text: "**Derivation Tracking**: Are derivation relationships tracked to maintain alignment of code with design and requirements?"
        },
        {
          text: "**Succession Records**: Are succession relationships recorded for each CI to document version history and creation dates?"
        },
        {
          text: "**Variant Assessment**: If variants are used, are their relationships documented and is their long-term maintenance cost evaluated?"
        },
        {
          text: "**SBOM Accuracy**: Is an SBOM maintained tracking all components, libraries, and modules, including licenses and dependencies?"
        },
        {
          text: "**VCS Integration**: Is source code stored in a version control system that supports multiple development streams and traceability?"
        },
        {
          text: "**Binary Hash Auditing**: Are compiled binaries associated with cryptographic hashes in a repository to support PCA validation?"
        },
        {
          text: "**DML Isolation**: Is a definitive media library used to isolate release baselines of artifacts from development areas?"
        },
        {
          text: "**Library Access Control**: Are promotion gates protected by access control policies to prevent unauthorized baseline changes?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software configuration identification, controlled items, and baselines",
  filename: "configuration-identification",
  trigger: "model_decision"
});
