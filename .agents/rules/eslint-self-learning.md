---
description: linting, fixing lint errors, formatting, typescript checks, or type errors
trigger: model_decision
---

# ESLint Self-Learning & Troubleshooting Rules

## 1. Domain Theory and Conceptual Foundations
Static program analysis is an essential software quality gate that examines source code without executing the program. By integrating static analysis tools like ESLint and the TypeScript Compiler (TSC) into the development workflow, engineering teams can mathematically verify syntax correctness, enforce style standards, and catch semantic errors early in the lifecycle. However, automated fix runners can occasionally fall into deadlock loops or conflict with compiler-level configuration options. This document establishes guidelines for managing automated linter loops, resolving tool conflicts, and enforcing quality standards.

### 1.1 Abstract Syntax Trees (AST) and Linter Architecture
Linter rules analyze and transform code by parsing the text into an Abstract Syntax Tree (AST), which represents the grammatical structure of the program as a tree of nodes (e.g., `VariableDeclaration`, `ArrowFunctionExpression`, `BinaryExpression`). 
- **AST Parsing**: The parser converts raw source code strings into nested JSON structures. For TypeScript, the parser is often `@typescript-eslint/parser`.
- **AST Traversal and Selection**: Rules register callbacks for specific node types. When the linter encounters a matching node, it checks for quality constraints.
- **Auto-Fix Transformations**: Rules can suggest text replacements at specific coordinate ranges in the source file. If multiple rules make modifications to overlapping ranges, the AST becomes corrupted, resulting in compiler crashes or infinite edit loops.

### 1.2 The Linter Feedback Loop and Infinite Fix Deadlocks
Automated lint runners (like `eslint --fix`) work by applying transformation rules to the AST. In complex environments, multiple rules can conflict, leading to an infinite cycle:
- **Auto-Fix Loops**: Rule A modifies the AST to satisfy a style constraint, which violates Rule B. Rule B then rewrites the AST, violating Rule A. The runner enters an infinite loop or repeatedly fails without resolving the root issues.
- **Mock Promise Deadlocks**: Conflicting rules can cause a test's mock implementation to be repeatedly altered (e.g., removing a redundant return value vs. flagging an empty function block).
To prevent wasting compute resources and model context space, a strict limit must be placed on automated fix iterations.

### 1.3 Software Quality and Coding Conventions
Enforcing specific coding conventions reduces cognitive load and prevents common JavaScript/TypeScript runtime issues:
- **Yoda Comparisons**: Placing constants on the left side of comparison operators (e.g., `null === value`) prevents accidental assignment errors (e.g., `value = null` inside an `if` condition).
- **Arrow Function Syntax**: Enforcing arrow functions over function declarations simplifies scope binding (avoiding lexical `this` overrides) and aligns with modern React standards.
- **Explicit Accessibility Modifiers**: Requiring `public`, `private`, or `protected` modifiers on class members ensures explicit API contracts and clear encapsulation boundaries.
- **Branded Types and Type Aliases**: Using TypeScript `type` statements instead of `interface` provides support for union, intersection, and branded types, which are crucial for domain-driven design constraints.

### 1.4 Null Safety and Lodash Implementations
Implicit truthy/falsy checks in JavaScript can lead to subtle bugs (e.g., treating the number `0` or an empty string `""` as nullish). Using explicit helper functions like Lodash's `isNil` ensures that only `null` and `undefined` values are matched. To prevent importing the entire Lodash library and bloat bundle sizes, developers must import individual methods using direct paths (e.g., `import isNil from "lodash/isNil.js"`).

### 1.5 Temporal Data Management and Luxon
JavaScript's native `Date` object is notorious for timezone handling issues, mutable API states, and lack of standardized formatting. To prevent temporal defects, native date objects are banned in the workspace. All date parsing, normalization, comparison, and formatting must be managed using Luxon (`DateTime`), which provides immutable datetime models and robust timezone governance.

## 2. Standard Operating Procedures (SOP)

### Step 2.1: Managing Linting Failures and the Fix Limit
When compiling or linting the codebase, track the execution attempts. If the lint command fails to resolve after 3 attempts, halt execution and seek guidance:
```bash
# Run the lint utility with fix capabilities
rtk pnpm --filter @ethang/agents-build lint
# If errors persist after 3 runs, do not run global git resets. Restore only modified files:
rtk git restore packages/agents-build/src/content/rules/target-file.ts
# Stop and ask the user for explicit guidance.
```

### Step 2.2: Enforcing Yoda Comparisons and Arrow Functions
Ensure all conditional evaluations place constants first and all methods are declared as arrow functions:
```typescript
// Incorrect: function declaration and non-Yoda comparison
function checkStatus(status: string) {
  if (status === "ACTIVE") {
    return true;
  }
  return false;
}

// Correct: arrow function and Yoda comparison
const checkStatus = (status: string) => {
  if ("ACTIVE" === status) {
    return true;
  }
  return false;
};
```

### Step 2.3: Implementing Explicit Class Accessibility Modifiers
Declare all class members with clear visibility boundaries:
```typescript
export class UserRegistration {
  private readonly databaseConnector: Database;

  public constructor(database: Database) {
    this.databaseConnector = database;
  }

  public registerUser = async (email: string) => {
    return this.databaseConnector.insert(email);
  };
}
```

### Step 2.4: Resolving Mock Promise Deadlocks
When mocking async methods in Vitest, insert a comment inside empty mock functions or use Lodash's `noop` to prevent empty block warnings:
```typescript
import noop from "lodash/noop.js";

// Option A: Use Lodash noop
const spy = vi.fn(noop);

// Option B: Insert an empty comment to prevent the compiler from stripping the block
const asyncSpy = vi.fn(async () => {
  // do nothing
});
```

### Step 2.5: Enforcing Safe Index Signature Access
In packages with `noPropertyAccessFromIndexSignature` enabled, use bracket notation to access properties on index-signature types:
```typescript
const data: Record<string, any> = { id: "123" };

// Incorrect: dot notation on index-signature type
const id = data.id;

// Correct: bracket notation access
const safeId = data["id"];
```

### Step 2.6: Declaring Explicit Tuple Types in Vitest Parameterized Tests
When testing parameterized tables with varying types, explicitly type the tuples to prevent type-inference bugs:
```typescript
import { describe, expect, it } from "vitest";

describe("tuple verification", () => {
  it.each<[string, number, boolean]>([
    ["active", 200, true],
    ["inactive", 400, false]
  ])("validates %s state with code %i", (status, code, isValid) => {
    expect(status).toBeDefined();
    expect(code).toBeGreaterThan(0);
    expect(isValid).toBeDefined();
  });
});
```

### Step 2.7: Running the Workspace Validation Command Suite
Ensure code correctness by running the build, test, and lint sequence with the `rtk` command prefix:
```bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
```

## 3. Agent Compliance Checklist
The agent must verify compliance with the following static analysis and troubleshooting rules:

- [ ] **Fix Loop Limit**: Has the linter run count been monitored, and did you stop after 3 failed attempts?
- [ ] **No Auto-Revert**: If linter changes broke functionality, did you avoid global git resets and restore only target files?
- [ ] **Single Category Fix**: Did you fix only one category of lint issues at a time, checking with the user before proceeding?
- [ ] **Yoda Comparisons Enforced**: Are all comparisons structured with constants on the left side of the operator (e.g., `"val" === variable`)?
- [ ] **Arrow Functions Used**: Are all function declarations defined as arrow functions?
- [ ] **Explicit Member Modifiers**: Do all class properties and methods contain explicit visibility keywords (`public`/`private`/`protected`)?
- [ ] **Type Over Interface**: Are TypeScript type declarations defined using the `type` keyword?
- [ ] **Inline Type Imports**: Are type imports structured inline (e.g., `import type { Type } from "./file"`)?
- [ ] **Lodash isNil Utilized**: Are nullable checks performed using Lodash's `isNil` rather than implicit truthy/falsy checks?
- [ ] **Individual Lodash Imports**: Are Lodash methods imported individually from their direct paths (`lodash/map.js`)?
- [ ] **Banned Date Object**: Has the JavaScript native `Date` object been completely avoided, using Luxon (`DateTime`) instead?
- [ ] **Mock Promise Deadlocks Avoided**: Are mock functions set to `noop` or annotated with internal comments to prevent linter auto-fix conflicts?
- [ ] **Index Signature Access**: Are dynamic properties on index-signature types accessed exclusively via bracket notation?
- [ ] **Vitest Hooks Avoided**: Have you avoided Vitest setup hooks, utilizing `onTestFinished` within helper functions instead?
- [ ] **Tuple Typing in Tests**: Are Vitest `it.each` tables explicitly typed as tuples to prevent parameter signature mismatches?
- [ ] **Void Assertions Wrapped**: Are test cases asserting successful completion of void methods wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **No Forbidden Terminology**: Has the code been scanned to verify no restricted words are present?
- [ ] **Rule Character Bounds**: Is the compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Backticks Escaped**: Are all backticks and code snippets in the rule content template properly escaped?
- [ ] **Walkthrough Updated**: Are build errors, lint troubleshooting logs, and test results documented in `walkthrough.md`?
