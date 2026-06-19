import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const constructionTechnologies = defineRule({
  content: [
    {
      level: 1,
      text: "Software Construction Technologies",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software construction technologies encompass the methods, runtimes, languages, and tools that software engineers use to implement, run, and optimize executable systems. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 4, Section 4, construction technologies represent the physical and logical building blocks of software execution, dictating how designs are translated into executable solutions and validated under real-world constraints. Ranging from API designs and object-oriented runtime mechanisms to middleware, cloud-based microservices, and automated feedback loops, these technologies form the core tools of software construction. Understanding the trade-offs, capabilities, and limitations of each construction technology is essential to engineer secure, high-performance, and portable systems.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 API Design and Use",
      type: "header"
    },
    {
      text: "An Application Programming Interface (API) is a set of signatures exported by a library or framework, accompanied by statements defining the program's semantic behaviors. Good API design is easy to learn, difficult to misuse, easy to extend, complete, and maintains backward compatibility. As APIs usually outlast their implementations, they must remain stable to facilitate client application development and maintenance. For online interfaces, open standards such as OpenAPI define HTTP API contracts, enabling the automatic generation of server-side and client-side code. This supports the API-first approach, which prioritizes designing and building an application's APIs first using description languages.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Object-Oriented Runtime Issues",
      type: "header"
    },
    {
      text: "Object-oriented languages support powerful runtime mechanisms, including polymorphism and reflection, which increase program flexibility and adaptability:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Polymorphism and Dynamic Binding**: Polymorphism allows general operations to be defined without knowing the concrete types of objects until runtime. The program determines the exact execution behavior dynamically at runtime (dynamic binding), enabling loose coupling between abstractions and implementations."
        },
        {
          text: "**Reflection**: The capability of a program to observe and modify its own structure and behavior at runtime. Reflection allows the inspection of classes, interfaces, fields, and methods without compile-time knowledge of their names, supporting dynamic instantiation and parameterized method invocation."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Parameterization, Templates, and Generics",
      type: "header"
    },
    {
      text: "Parameterized types (generics or templates) enable a type or class to be defined without specifying all the other types it uses. The unspecified types are supplied as parameters at the point of use. Parameterization provides a powerful mechanism to compose reusable behaviors in strongly typed software, serving as an alternative to class inheritance and object composition while preserving compile-time type safety.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Assertions, Design by Contract, and Defensive Programming",
      type: "header"
    },
    {
      text: "These techniques improve construction quality by validating program states at runtime:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Assertions**: Executable predicates placed in code to check assumptions. They are valuable in high-reliability software, helping developers flush out mismatched interface assumptions. Assertions are typically compiled out of production releases to avoid performance degradation."
        },
        {
          text: "**Design by Contract**: An approach where routines define strict preconditions (caller requirements) and postconditions (routine guarantees). This establishes a formal contract clarifying API semantics."
        },
        {
          text: "**Defensive Programming**: A discipline where routines protect themselves from invalid inputs by checking all parameter values and executing error-handling paths for bad data."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Error Handling, Exception Handling, and Fault Tolerance",
      type: "header"
    },
    {
      text: "How errors are handled directly influences a system's correctness, robustness, and reliability:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Error Handling**: Techniques include returning neutral values, substituting the next piece of valid data, logging warning messages, returning error codes, or shutting down execution."
        },
        {
          text: "**Exception Handling**: Using throw statements to signal exceptional events and catch blocks within try-catch structures to process the error. Exception-handling policies must be carefully designed to prevent empty catch blocks and standardize exception reporting."
        },
        {
          text: "**Fault Tolerance**: Strategies that detect errors and recover from them (or contain their effects), such as backing up and retrying, using auxiliary code, voting algorithms, or replacing erroneous variables with phony benign values."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Executable Models",
      type: "header"
    },
    {
      text: "Executable models abstract away implementation details by using modeling languages (such as executable UML - xUML). A specification built in an executable modeling language can be deployed across various execution environments without change. A model compiler (transformer) turns a platform-independent model (PIM)—which describes the solution without implementation technology—into a platform-specific model (PSM) and executable code.",
      type: "text"
    },
    {
      level: 3,
      text: "1.7 State-Based and Table-Driven Construction",
      type: "header"
    },
    {
      text: "These techniques replace complex branch logic with structured data or state representations:",
      type: "text"
    },
    {
      items: [
        {
          text: "**State-Based Programming**: Uses finite-state machines to describe program behaviors, leveraging transition graphs during specification, coding, and debugging."
        },
        {
          text: "**Table-Driven Methods**: A schema that uses tables to display and look up information rather than conveying it through logic statements (such as nested if-else or switch structures), simplifying modification and readability."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.8 Runtime Configuration and Internationalization",
      type: "header"
    },
    {
      text: "These technologies support system customization without code modifications:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Runtime Configuration**: Enables late binding of variables and settings when the program is running, usually by reading configuration files in a just-in-time mode."
        },
        {
          text: "**Internationalization and Localization**: Preparing interactive software to support multiple locales (internationalization) and language translations of prompts, help screens, error displays, and character sets (localization) with minimal processing impact."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.9 Grammar-Based Input Processing",
      type: "header"
    },
    {
      text: "Grammar-based input processing involves parsing input token streams to build data structures such as parse trees or syntax trees. The program traverses the parse tree, verifies variables in a symbol table, and uses the resulting structure as input for computational processes.",
      type: "text"
    },
    {
      level: 3,
      text: "1.10 Concurrency Primitives",
      type: "header"
    },
    {
      text: "A synchronization primitive is a programming abstraction provided by the language or operating system to coordinate simultaneous access to resources:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Mutex**: Mutually exclusive locks that grant single-thread access to a resource."
        },
        {
          text: "**Semaphore**: A protected variable controlling access using a counter."
        },
        {
          text: "**Monitor**: An abstract data type executing procedures with mutual exclusion."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.11 Middleware",
      type: "header"
    },
    {
      text: "Middleware represents software that resides above the operating system and below the application layer, providing services like message passing, persistence, and network location transparency. Modern message-oriented middleware utilizes an enterprise service bus (ESB) to support service-oriented communication.",
      type: "text"
    },
    {
      level: 3,
      text: "1.12 Distributed and Cloud-Based Software",
      type: "header"
    },
    {
      text: "Distributed software construction must handle parallelism, remote communication, and network fault tolerance:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Architecture**: Distributed applications run across client-server, n-tier, or microservice architectures."
        },
        {
          text: "**Cloud Infrastructure**: Cloud-native software utilizes API gateways, containers, and service registration/discovery, relying on SAGA-based eventual consistency instead of strict ACID transactions across microservices."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.13 Constructing Heterogeneous Systems",
      type: "header"
    },
    {
      text: "Heterogeneous systems combine specialized computational units (such as GPUs, DSPs, microcontrollers, and peripheral processors) that communicate with one another. Embedded systems are typically heterogeneous, requiring hardware/software codesign, stepwise decomposition, co-simulation, and multi-language validation.",
      type: "text"
    },
    {
      level: 3,
      text: "1.14 Performance Analysis and Tuning",
      type: "header"
    },
    {
      text: "Performance analysis investigates a program's execution behavior to identify resource hot spots. Code tuning modifies correct code at the logic, loop, or expression level to optimize speed and memory footprint.",
      type: "text"
    },
    {
      level: 3,
      text: "1.15 Platform Standards",
      type: "header"
    },
    {
      text: "Platform standards enable developers to build portable applications that execute in compatible environments without changes. Examples include POSIX, Jakarta EE, and HTML5.",
      type: "text"
    },
    {
      level: 3,
      text: "1.16 Test-First Programming",
      type: "header"
    },
    {
      text: "Also known as Test-Driven Development (TDD), this style requires writing failing test cases before implementing production code. Code is then written to make the tests pass, followed by refactoring. This detects defects early and forces requirements clarity.",
      type: "text"
    },
    {
      level: 3,
      text: "1.17 Feedback Loops for Construction",
      type: "header"
    },
    {
      text: "Continuous feedback loops are core to agile and DevOps practices, utilizing automated builds, automated testing, canary releases, and A/B testing to quickly evaluate how code performs in staging and production.",
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
          text: "Were the APIs designed to be easy to learn, difficult to misuse, backward-compatible, and documented using standards like OpenAPI?"
        },
        {
          text: "Did the implementation leverage object-oriented runtime mechanisms (polymorphism, reflection) to ensure flexibility and loose coupling?"
        },
        {
          text: "Were generics or parameterized templates used to define reusable type behaviors while maintaining type safety?"
        },
        {
          text: "Were assertions, design-by-contract preconditions/postconditions, and defensive programming checks applied to validate runtime states?"
        },
        {
          text: "Did the error and exception handling follow centralized policies to prevent empty catch blocks and standardize logging formats?"
        },
        {
          text: "Were fault tolerance strategies (retry logs, backing up, voting algorithms) implemented to contain error propagation?"
        },
        {
          text: "Was the application's logic structured using executable models, state machines, or table-driven lookups to minimize conditional branches?"
        },
        {
          text: "Was the software prepared for late-binding runtime configuration and internationalization/localization of user strings and character sets?"
        },
        {
          text: "Did the program process complex token streams using grammar-based parsing and syntax tree evaluations?"
        },
        {
          text: "Were concurrent execution paths synchronized using primitive locks, mutexes, semaphores, or monitors to prevent data races?"
        },
        {
          text: "Did the system utilize middleware or an Enterprise Service Bus (ESB) to handle distributed messaging and network transparency?"
        },
        {
          text: "Were cloud-native architectures (microservices, containers, API gateways, service discovery) designed for SAGA eventual consistency?"
        },
        {
          text: "Was the hardware/software codesign of heterogeneous systems validated through co-simulation and stepwise decomposition?"
        },
        {
          text: "Were performance profiling and code tuning techniques executed on verified hot spots to optimize logic and loops?"
        },
        {
          text: "Did the constructed components adhere to platform standards (POSIX, HTML5, Jakarta EE) to ensure portability?"
        },
        {
          text: "Was test-first programming (TDD) practiced to detect defects early and validate requirements before coding?"
        },
        {
          text: "Did the development process leverage automated feedback loops (automated building, testing, and canary releases) to monitor code quality?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software construction technologies, API design, polymorphism, reflection, generics, assertions, error and exception handling, fault tolerance, executable models, state-based, table-driven, late binding, internationalization, grammar parsing, concurrency primitives, middleware, distributed systems, cloud microservices, heterogeneous systems, performance tuning, platform standards, test-first programming, and feedback loops",
  filename: "construction-technologies",
  trigger: "model_decision"
});
