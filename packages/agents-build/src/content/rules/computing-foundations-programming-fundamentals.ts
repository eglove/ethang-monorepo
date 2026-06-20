import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const computingFoundationsProgrammingFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Computing Foundations: Programming Fundamentals and Languages",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "A software engineer must distinguish the disciplined practice of software engineering from simple computer programming. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 16, Section 4, programming fundamentals and languages form the operational substrate upon which software engineering designs are executed. While a programmer focuses primarily on translating a specific algorithm into code instructions, compiling, and executing it, a software engineer evaluates programming languages as architectural tools. Selecting a programming language requires analyzing hardware and operating system constraints, compiling or interpreting efficiency, runtime type safety, memory layout costs, and team maintenance capabilities.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Programming Language Paradigms and Translation Mechanisms",
      type: "header"
    },
    {
      text: "Programming languages are classified based on their underlying paradigms, which shape how developers model solutions and how systems execute instructions.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Functional Paradigm**: Focuses on evaluating mathematical functions, avoiding mutable state. It emphasizes purity, immutability, first-class functions, and declarative control flow."
        },
        {
          text: "**Procedural Paradigm**: Emphasizes sequential statements that modify state, aligning with von Neumann architectures."
        },
        {
          text: "**Object-Oriented Paradigm**: Groups data and operations into objects, facilitating modularity and encapsulation."
        },
        {
          text: "**Scripting Paradigm**: Frequently interpreted languages designed for rapid development, automation, and task glueing, often utilizing dynamic typing."
        },
        {
          text: "**Logic Paradigm**: Uses mathematical logic, where execution is systematic theorem proving."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Many modern languages support multiple paradigms. Software engineers analyze these paradigms to select the most appropriate one for the target application.",
      type: "text"
    },
    {
      text: "The translation of high-level source code into machine-executable instructions is carried out by translation systems:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Compilers**: Translate the entire source program into machine code before execution, creating high-performance executables but requiring a distinct build phase."
        },
        {
          text: "**Interpreters**: Translate and execute instructions line-by-line at runtime, providing flexibility and rapid development loops at the cost of execution performance."
        },
        {
          text: "**Cross-Compilers and Assemblers**: Cross-compilers produce executable code for a platform other than the one on which the compiler is running. Assemblers translate assembly mnemonics directly into binary machine code."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "The compilation pipeline is composed of distinct phases:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Preprocessing**: Resolves macros, file inclusions, and conditional compilation directives."
        },
        {
          text: "**Lexical Analysis**: Groups characters into meaningful tokens (keywords, identifiers, operators)."
        },
        {
          text: "**Syntax Analysis**: Parses tokens into a hierarchical structure, such as a parse tree or abstract syntax tree (AST)."
        },
        {
          text: "**Intermediate Code Generation**: Produces a machine-independent representation of the program to facilitate optimization."
        },
        {
          text: "**Optimization**: Restructures intermediate code to improve execution speed or reduce memory footprint."
        },
        {
          text: "**Code Generation**: Translates optimized intermediate code into target machine instructions."
        },
        {
          text: "**Linkers and Loaders**: Linkers resolve external references. Loaders copy the final executable into physical memory."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Syntax, Semantics, and Type Systems",
      type: "header"
    },
    {
      text: "To construct robust software, engineers must understand the relationship between a language's syntax and its semantics.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Syntax**: Grammars define the set of valid token sequences. The parser utilizes operator precedence and associativity weights to resolve ambiguities in expressions."
        },
        {
          text: "**Semantics**: Dictates how the state of the system changes when a statement is executed. While syntax is verified during compilation, semantic errors often manifest only at runtime."
        },
        {
          text: "**Type Systems**: Type systems assign types to program variables, expressions, and subprograms to enforce data constraints.\n- **Static Typing**: Types are declared and verified at compile-time (e.g., C, C++, Java). This detects type-mismatches early, improves performance, and enables better tooling support.\n- **Dynamic Typing**: Types are determined and checked at runtime depending on the context (e.g., Python, Ruby, JavaScript). This increases flexibility but requires thorough runtime test coverage.\n- **Polymorphic Typing**: Enables a single variable or function to handle multiple data types, enhancing code adaptability and reducing duplication."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Subprograms, Parameter Passing, and Coroutines",
      type: "header"
    },
    {
      text: "Subprograms (functions and procedures) are the primary mechanism for structural decomposition, enabling engineers to split large systems into manageable, cohesive, and reusable units.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Scope and Lifetime**: Parameters and variables declared inside a subprogram are dynamic and local to its execution scope. However, static variables retain their values across multiple invocations."
        },
        {
          text: "**Parameter Passing Mechanisms**:\n- **Pass-by-Value**: Passes a copy of the argument. Modifications inside the subprogram do not affect the caller's variable.\n- **Pass-by-Reference**: Passes the memory address of the argument. Changes directly modify the caller's variable.\n- **Pass-by-Name**: Substitutes the argument expression directly, evaluating it each time it is accessed.\n- **Pass-by-Result**: The parameter acts as a local variable but its final value is copied back to the caller upon exit.\n- **Pass-by-Value-Result**: Combines value and result; the value is copied in, modified, and copied back out on termination.\n"
        },
        {
          text: "**Recursion**: A subprogram calls itself, either directly (cyclic) or indirectly through another subprogram (acyclic). Recursive programs require a strict exit condition. At runtime, each recursive call allocates a new activation record on the stack to store parameters and return addresses."
        },
        {
          text: '**Coroutines**: Subprograms with multiple entry and exit points. Unlike standard subroutines that start execution from the beginning on every call, a coroutine suspends execution at a specific point and can be resumed later from that exact location, preserving its local state. Coroutine calls are invoked using "resume" operations, which is highly useful for cooperative multitasking, event-driven loops, and generator pipelines.'
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Object-Oriented Programming Principles",
      type: "header"
    },
    {
      text: "Object-oriented programming (OOP) models software systems as collections of interacting objects. The key pillars of OOP are:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Abstraction**: Exposes only the necessary interface and behaviors to the client while hiding the underlying implementation details."
        },
        {
          text: "**Encapsulation**: Binds data (attributes) and methods (operations) together inside a class, restricting direct access using visibility modifiers (public, private, protected) to protect data integrity."
        },
        {
          text: '**Inheritance**: Allows a subclass to inherit attributes and behaviors from a base class, promoting reuse and modeling "is-a" relationships.'
        },
        {
          text: "**Polymorphism**: Provides a single interface to entities of different types.\n- **Static (Compile-time) Polymorphism**: Achieved via method overloading, where functions share a name but differ in parameter count or type signature.\n- **Dynamic (Runtime) Polymorphism**: Achieved via method overriding, where a subclass overrides a base class method, resolved at runtime based on the object's actual instance type."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Parallel, Distributed, and Concurrent Programming",
      type: "header"
    },
    {
      text: "To satisfy modern performance requirements, software engineers must design concurrent systems:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Parallel Programming**: Multiple processors or cores on a single physical machine execute tasks simultaneously, typically sharing a common memory space. Inter-process communication (IPC) or memory buses are used to coordinate."
        },
        {
          text: "**Distributed Programming**: Multiple networked computers execute separate parts of a program, communicating via network messages. Each machine has its own isolated memory space. Distributed systems prioritize reliability and scalability."
        },
        {
          text: "**High Performance Computing (HPC)**: Integrates parallel and distributed paradigms to maximize execution throughput for large datasets."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Debugging and Programming Standards",
      type: "header"
    },
    {
      text: "Software construction involves identifying and correcting program errors:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Syntax Errors**: Deviations from the grammatical rules of the language, caught by the compiler."
        },
        {
          text: "**Runtime Errors**: Occur during execution when the program attempts an invalid operation (e.g., dividing by zero, memory access violations, array out-of-bounds)."
        },
        {
          text: "**Logical Errors**: Flaws in the implementation of the business logic, producing incorrect results without throwing exceptions. Debuggers, breakpoints, and execution tracing are used to resolve these."
        },
        {
          text: "**Coding Standards**: Establishing consistent styling and structure across development teams. Following standards (such as SEI CERT for security or MISRA for reliability) minimizes bugs. The subcommittee ISO/IEC JTC 1/SC 22 standardizes programming languages and system software interfaces."
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
          text: "Was the selection of the programming language or paradigm justified based on requirements, platform constraints, and performance targets?"
        },
        {
          text: "Are translation pipeline choices (compilers, interpreters, linkers) evaluated for build and execution performance?"
        },
        {
          text: "Does the codebase distinguish between static and dynamic typing models, applying static validation where safety is critical?"
        },
        {
          text: "Are operator precedence and associativity rules explicitly accounted for in complex mathematical and logical expressions?"
        },
        {
          text: "Are subprogram parameters passed using the correct mechanism (pass-by-value or pass-by-reference) to prevent unintended side-effects?"
        },
        {
          text: "Do all recursive subprograms contain verified, reachable exit conditions that prevent execution stack overflow?"
        },
        {
          text: "Are variable lifetimes and scopes kept local to minimize memory footprint and avoid global state pollution?"
        },
        {
          text: "If coroutines are used, is their suspend-and-resume execution flow documented to prevent resource leaks and concurrency issues?"
        },
        {
          text: "Are class properties encapsulated using private or protected visibility modifiers to protect object state from external corruption?"
        },
        {
          text: "Does the class design hide implementation details via abstraction, exposing only essential interfaces?"
        },
        {
          text: 'Does inheritance model a genuine "is-a" relationship, avoiding deep hierarchies that complicate maintenance?'
        },
        {
          text: "Is dynamic polymorphism used to handle type-specific behaviors, ensuring overridden methods conform to base contracts?"
        },
        {
          text: "Did the architecture design evaluate the resource trade-offs between shared-memory parallel programming and message-passing distributed programming?"
        },
        {
          text: "Are syntax, runtime, and logical errors systematically separated and verified using automated test suits and debuggers?"
        },
        {
          text: "Does the code comply with external or internal programming standards (such as ISO/IEC JTC 1/SC 22, CERT, or MISRA)?"
        },
        {
          text: "Have debugger breakpoints and stack traces been checked to ensure proper variable propagation in nested routines?"
        },
        {
          text: "Are compiler optimization flags and linking options configured to produce efficient, secure production binaries?"
        },
        {
          text: "Were local subprograms modularized to ensure each routine performs a single cohesive task, easing verification?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "programming language types, functional programming, procedural programming, OOP, scripting, compilers, interpreters, compilation phases, programming syntax, semantics, type systems, static typing, dynamic typing, subprograms, coroutines, parameter passing, recursion, abstraction, encapsulation, inheritance, polymorphism, distributed programming, parallel programming, debugging, coding standards",
  filename: "computing-foundations-programming-fundamentals",
  trigger: "model_decision"
});
