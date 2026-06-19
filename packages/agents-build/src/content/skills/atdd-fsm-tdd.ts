import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const atddFsmTdd = defineSkill({
  content: [
    {
      level: 1,
      text: "ATDD + FSM Coverage + TDD (Red-Green-Refactor) Guide (/atdd-fsm-tdd)",
      type: "header"
    },
    {
      text: "This skill coordinates the software development process using a combination of Acceptance Test-Driven Development (ATDD), Finite-State Machine (FSM) modeling, and the Red-Green-Refactor Test-Driven Development (TDD) micro-cycle using Vitest.",
      type: "text"
    },
    {
      text: "[!IMPORTANT]\nBefore writing any code or beginning implementation under this skill, you MUST read the following SWEBOK reference documents using the `view_file` tool to obtain the necessary theoretical foundations:\n1. [Requirements Specification](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/swebok/resources/requirements-specification.md)\n2. [Software Testing Techniques](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/swebok/resources/testing-techniques.md)\n3. [Mathematical Foundations - Finite State Machines](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/swebok/resources/mathematical-foundations-finite-state-machines.md)",
      type: "quote"
    },
    {
      level: 2,
      text: "Step-by-Step Development Process",
      type: "header"
    },
    {
      text: "You MUST strictly execute the development process in the following four sequential phases:",
      type: "text"
    },
    {
      items: [
        {
          children: [
            {
              text: "Write human-readable **Given-When-Then BDD scenarios** to represent business expectations."
            },
            {
              text: String.raw`Model the component as a **Finite-State Machine (FSM)**. Formally specify the states $S$, inputs/events $I$, outputs/actions $O$, and the transition function $f: S \times I \to S$. Use a table (State Table) or transition graph to clarify logic.`
            }
          ],
          text: "📋 **Phase 1: ATDD Elicitation and Modeling**"
        },
        {
          children: [
            {
              text: "Before implementing any feature logic, write **failing Vitest tests (Red)**."
            },
            {
              text: "Ensure test coverage targets **100% of defined state transitions** (positive paths)."
            },
            {
              text: "Create test cases for **invalid state-input pairs** (negative exception paths) to verify exception handling and error state transitions."
            }
          ],
          text: "🔴 **Phase 2: The Red Phase (Failing Transition Tests)**"
        },
        {
          children: [
            {
              text: "Write the **minimal production code** or update the state transition table/matrix to pass the failing tests (Green)."
            },
            {
              text: "Avoid writing premature logic or excess branch statements outside the current tests."
            }
          ],
          text: "🟢 **Phase 3: The Green Phase (Minimal Code)**"
        },
        {
          children: [
            {
              text: "Clean up code smells (e.g., God Classes, Long Methods, duplicate code) and optimize logic structure."
            },
            {
              text: "Apply **State Minimization** rules to merge equivalent states and simplify transitions without altering behavior."
            },
            {
              text: "Run the Vitest regression suite continuously to guarantee **behavior preservation** (zero regressions)."
            }
          ],
          text: "🔄 **Phase 4: Refactor (Preventive Maintenance)**"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "State Transition Testing Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "Have all states, inputs (events), and outputs (actions) been explicitly enumerated?"
        },
        {
          text: "Is there a designated initial state $s_0$ that the system initializes to?"
        },
        {
          text: "Are there tests verifying both positive paths (valid transitions) and negative paths (invalid events in a state)?"
        },
        {
          text: "Has state minimization been applied to eliminate redundant states?"
        },
        {
          text: "Does the Vitest suite execute automatically to verify that refactoring preserved all behaviors?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "Guides state-driven feature development combining ATDD, FSM transition coverage, and the Red-Green-Refactor TDD cycle using Vitest, aligned with SWEBOK v4 guidelines.",
  name: "atdd-fsm-tdd"
});
