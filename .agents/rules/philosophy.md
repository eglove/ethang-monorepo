---
trigger: always_on
---

# Working Philosophy

## 1. Domain Theory and Conceptual Foundations
Software engineering is defined by the IEEE Software Engineering Body of Knowledge (SWEBOK v4) as the systematic application of engineering principles to the development, operation, and maintenance of software systems. In contrast to ad-hoc programming practices, software engineering demands a disciplined adherence to defined processes, complete observability of validation runs, and strict safety limits when interacting with shared resources. As agents operating within a complex monorepo codebase, our professional practice must align directly with the foundational tenants of SWEBOK v4 Chapter 11 (Professional Practice), Chapter 8 (Software Engineering Process), and Chapter 10 (Software Quality).

### 1.1 Process Rigor vs. Developer Convenience
A primary concept in software quality management is that process quality directly correlates with product quality. SWEBOK v4 Chapter 8 outlines how defined software engineering processes reduce defect density and improve system predictability. When executing tasks in a workspace, bypassing steps (such as skipping local test executions, neglecting to lint modified files, or ignoring verification check failures) introduces unverified assumptions into the codebase. This is a common source of regression defects. Every change, regardless of size or perceived simplicity, must undergo the entire verification loop. This systematic approach ensures that no code is integrated without automated validation, preserving the integrity of the release baseline.

### 1.2 Executable Documentation and Specifications
SWEBOK v4 Chapter 10 describes verification as the process of ensuring that the software product conforms to its specifications. In modern agile software engineering, unit and integration tests serve as the primary vehicle for executable documentation. A test suite should read like a formal specification of the module under test, describing the system behavior under various scenarios, boundary conditions, and error states. If an engineer or agent must read the production implementation code to understand what a module is supposed to do, the tests have failed in their documentation role. Maintaining highly descriptive, clean, and complete tests is critical for long-term codebase maintainability.

### 1.3 Human-Agent Checkpoints and Boundary Security
The relationship between an autonomous or semi-autonomous development agent and the human engineer is governed by control boundaries. SWEBOK v4 Chapter 11 details the ethical and professional responsibility of engineers to maintain public safety, security, and client trust. In an agentic context, this translates to the enforcement of mandatory user checkpoints. The agent must never perform high-risk, destructive, or ambiguous operations without obtaining explicit, recorded consent from the user. Checkpoints serve as formal verification gates, preventing runaway execution paths and ensuring that the agent's work remains fully aligned with the user's intent and expectations.

### 1.4 System Observability and Complete Feedback Loops
A fundamental principle of Software Quality Assurance (SQA) is total observability. Suppressing output, truncating logs, or filtering error traces prevents proper diagnostic analysis. When running test suites or compiler checks, streaming the full, raw output is necessary to identify secondary warnings, dependency conflicts, or deprecation notices. Truncated output hides critical context, making it difficult to debug complex regression errors. Complete feedback loops ensure that the developer has all the information needed to make informed correction decisions.

### 1.5 Concurrency and Latency Minimization in Tool Orchestration
In a complex workspace with multiple modules and packages, agent execution efficiency is highly dependent on tool calling strategies. Parallel tool execution (fan-out) is a pattern where independent, non-interdependent tool actions are executed simultaneously. This minimizes round-trip latency and reduces token consumption by avoiding serial steps. For example, reading multiple file contents, searching the web, or performing parallel index queries do not depend on each other and should be executed in a single turn. Conversely, sequential execution is reserved for dependent pipelines where the output of one step is required to initiate the next.

## 2. Standard Operating Procedures (SOP)

### Step 2.1: Rigorous Lifecycle Execution
Every code modification task must follow this exact sequence without exception:
1. Parse the entire user request and identify the specific packages, dependencies, and rules involved.
2. Search the codebase for existing patterns, utilities, and test files to maintain design consistency.
3. Draft a failing unit test that describes the new feature or demonstrates the bug (Red phase).
4. Implement the minimal production code change required to make the test pass (Green phase).
5. Refactor the code for maintainability, ensuring that linting and build checks pass (Refactor phase).
6. Verify the entire package using its local test suite and linter scripts.
7. Conduct a final review of the generated git diff to check for style violations.

### Step 2.2: Writing Tests as Specifications
When authoring or modifying test files, ensure they serve as clear, readable documentation:
1. Name test blocks with descriptive strings that clarify the system state being verified.
2. Use parameterization (such as Vitest's `it.each`) to test multiple boundary conditions in a concise layout.
3. Write test helper methods using arrow functions to prevent lexical context issues.
4. Avoid specifying explicit return types for test helpers to rely on TypeScript's inference mechanisms.
5. Decorate mock classes with explicit accessibility modifiers for all members (e.g. `public`, `private`).
6. Avoid using global variables for mocks; mock classes should be imported to prevent Vitest hoisting errors.

Below is a compliant test file structure illustrating these rules:

```typescript
import { vi } from "vitest";

class MockDatabaseConnection {
  private isConnectedState: boolean;

  public constructor() {
    this.isConnectedState = false;
  }

  public connect = () => {
    this.isConnectedState = true;
  };

  public isConnected = () => {
    return this.isConnectedState;
  };
}

describe("Database Connection Manager", () => {
  it("should establish connection successfully when initialized", () => {
    const connection = new MockDatabaseConnection();
    expect(() => {
      connection.connect();
    }).not.toThrow();
    
    const status = connection.isConnected();
    expect(status).toBe(true);
  });
});
```

### Step 2.3: Invoking Mandatory User Checkpoints
The agent must suspend execution and prompt the user for direction under the following conditions:
1. When proposing destructive commands (such as directory deletions or force resets).
2. When resolving ambiguous requirements where multiple valid architectural designs exist.
3. When external dependencies must be added, updated, or removed from a package.
4. When a rule file specifically mandates a checkpoint.
To issue a checkpoint request, explain the problem, present the options with their pros and cons, propose a default choice, and wait for the user to approve or reject.

### Step 2.4: Managing Command Output and Observability
Maintain maximum transparency during command executions:
1. Always run commands using the `rtk` prefix to clean up terminal formatting without hiding core details.
2. Stream full outputs of test runs. Do not truncate log buffers or ignore warning logs.
3. When debugging, capture and analyze the complete call stack trace rather than guessing the error location.

### Step 2.5: Implementing Fan-Out Orchestration
Minimize task duration by executing independent tool calls in parallel:
1. Analyze tool requirements to build a dependency graph.
2. Group all independent actions (e.g. reading files, performing searches) into a single step.
3. Invoke the tool calls concurrently.
4. Do not chain independent operations sequentially. Wait for parallel operations to complete before processing dependent tools.

### Step 2.6: Version Control Integrity Gates
Protect the remote repository and workspace state from unauthorized actions:
1. Never run commands that push commits, create pull requests, or write comments to remote hosts unless explicitly requested.
2. When asked to revert changes, use targeted recovery commands (e.g. `git restore`) on specific files.
3. Avoid running global checkouts or resets that could destroy unrelated, unsaved developer work in the workspace.

## 3. Agent Compliance Checklist

- [ ] **Workflow Integrity**: Did you execute all workflow phases sequentially without skipping any steps?
- [ ] **Test-First Red-Green**: Did you write a failing test and verify it fails before modifying production code?
- [ ] **Tests as Documentation**: Do your test cases serve as a clear, self-documenting specification?
- [ ] **Arrow Functions Enforced**: Are all functions in code and test examples formatted as arrow functions?
- [ ] **No Explicit Return Types**: Did you avoid explicit return types in your TypeScript code blocks?
- [ ] **Explicit Member Modifiers**: Are all mock class properties and methods annotated with explicit accessibility?
- [ ] **Hoisting Errors Prevented**: Are mock classes imported rather than declared locally to avoid hoisting failures?
- [ ] **Bracket Notation Applied**: Did you access properties on index-signature types using bracket notation?
- [ ] **Checkpoints Honored**: Did you pause and prompt the user at every mandatory confirmation checkpoint?
- [ ] **Clear Checkpoint Delivery**: Did you present options, trade-offs, and a recommendation at the checkpoint?
- [ ] **Complete Output Streamed**: Did you stream the full execution output of all test and lint commands?
- [ ] **Parallel Fan-Out Grouping**: Did you invoke all independent tool calls concurrently in a single turn?
- [ ] **Dependent Sequential Chains**: Did you serialize tool calls only when they had direct data dependencies?
- [ ] **No Unrequested Git Push**: Did you verify that no git push, commit, or PR comment was performed?
- [ ] **Targeted Restore Execution**: Did you restore only agent-modified files when reverting workspace changes?
- [ ] **Forbidden Words Verification**: Has the text been checked to ensure no restricted words are present?
- [ ] **SWEBOK Standards Alignment**: Does the rule ground the working philosophy in SWEBOK v4 principles?
