export const ch04Construction = {
  content: `# Software Construction (SWEBOK v4, Chapter 4)

> Scope: the detailed creation of software through coding, verification, unit and integration testing, and debugging. This chapter is the canonical theory owner for the GREEN-phase construction discipline (test-first, minimum-change), defensive programming, design by contract, API design, exception handling, integration strategy, dependency management, and construction-quality measures referenced by the TDD overlay skills.

## When to Apply

- Writing or modifying production code (the GREEN phase after a RED test) — apply minimum-change construction and defensive checks.
- Designing or extending a public API, library signature, or HTTP contract.
- Choosing an integration strategy (CI vs phased) or adding/upgrading a dependency.
- Deciding how a routine handles invalid input or signals/propagates errors.
- Reviewing construction-level quality: complexity, assertions, exception policy, reuse vs copy-paste.

## Key Definitions

| Term | Definition |
|---|---|
| Cyclomatic complexity | Static measure of linearly independent paths through code (McCabe, 1976); there should be at least that many test cases |
| Assertion | Executable predicate doing runtime checks; compiled in during dev, compiled out of production builds |
| Design by Contract | Precondition (true before) + postcondition (guaranteed after) per routine; the routine "forms a contract" |
| Defensive programming | Protecting a routine from being broken by invalid inputs; check every parameter, decide explicitly how to handle bad input |
| Construction for / with reuse | Building reusable assets vs. building new software from existing assets |
| Dependency supply chain network | Direct + indirect dependencies; any node introduces risk |
| Test-first programming (TDD) | Write failing tests before code, write code to pass, then refactor/optimize |

## Test-First Construction Discipline (GREEN phase)

Canonical theory for the minimum-change construction step in the tdd-principles skill.

1. A failing test (RED) must already exist and fail for the right reason before any production code is written.
2. Write the **minimum** code that makes the failing test(s) pass — no speculative features, no untested branches.
3. Refactor and optimize only once green; tests stay green throughout.
4. Benefits driving the discipline: defects caught earlier and fixed cheaper; requirements/design problems exposed before coding commits to them.
5. Construction testing closes the fault-insertion-to-detection gap; do unit + integration testing yourself as the author, not system/alpha/beta/stress/usability testing.

## Defensive Programming, Design by Contract & Assertions

Canonical theory for the Design-by-Contract/assertion aside in the tdd-test-as-documentation skill.

- **Validate every input parameter** of a public routine; decide explicitly (do not default silently) how each bad-input class is handled.
- State **preconditions and postconditions** for each routine; they specify semantics and clarify behavior. A caller violating a precondition is a caller bug, not a routine bug.
- Use **assertions** for conditions that must never occur in correct code (high-reliability checks). They are compiled out of production — never put side effects or user-input validation in an assertion.
- Assertions check programmer errors (internal invariants); defensive input checks handle external/untrusted data. Use both, for different inputs.

## Exception Handling, Error Handling & Fault Tolerance

Error-handling technique selection:

| Technique | Use when |
|---|---|
| Return a neutral value | A safe default exists and callers tolerate it |
| Substitute next valid data | Streaming/successive data where one bad item is skippable |
| Log a warning message | Recoverable anomaly worth a diagnostic trail |
| Return an error code | Caller is expected to inspect and branch on status |
| Throw an exception | Error is exceptional and must interrupt normal flow |
| Shut down | Continuing would corrupt data or breach safety |

Exception policy rules:
- Include **all information that led to the exception** in the exception message.
- **No empty catch blocks** — every handler must log, re-throw, or explicitly handle.
- Know the exceptions library code throws; standardize the program's exception use; consider a centralized exception reporter.

Fault-tolerance techniques: back up and retry; auxiliary code + voting algorithms; replace an erroneous value with a benign phony value.

## API Design

A signature set plus stated semantics exported to users of a library/framework. Design so the API is:

- Easy to learn and memorize; leads to readable call sites.
- **Difficult to misuse** (the dominant constraint — make illegal states unrepresentable).
- Easy to extend; complete; backward-compatible and stable (APIs outlast their implementations).

For HTTP APIs use **OpenAPI** (language-agnostic, generates client + server code). The **API-first approach** establishes the contract via an API description language before implementation.

## Integration Strategy

| Strategy | Behavior | Verdict |
|---|---|---|
| Phased (big bang) | Delay integrating all parts until each is complete | Discouraged — error location is hard |
| Incremental | Combine and test one piece at a time; needs stubs, drivers, mocks | Preferred — easier error location, progress monitoring, earlier delivery |
| Continuous Integration (CI) | Integrate many times/day; automated pipeline builds + tests each integration | Standard — fastest feedback |

A CI pipeline must fail the build on failed tests, static-analysis failures, and security-scan failures.

## Dependency Management

- Package managers (pnpm, npm, Bun) automate install/upgrade/configure/remove.
- Every direct and indirect dependency is a node in the supply-chain network and a risk source.
- Before adding a dependency, clear three gates: **necessity** (avoid unnecessary deps — build efficiency), **license** (avoid conflicts — legal risk), **security** (avoid propagating defects/CVEs — quality risk).
- Put regulations/monitoring in place to block untrusted external dependencies.

## Construction Quality Measures

Primary construction-quality techniques: unit + integration testing, test-first development, assertions + defensive programming, debugging, inspections, technical reviews (incl. security-oriented), static analysis.

Measurable construction artifacts: code developed/modified/reused/destroyed, code complexity, inspection statistics, fault-fix and fault-find rates, effort, schedule. Programmers must know common vulnerability lists (e.g., OWASP) and run automated static analysis for security weaknesses.

Other construction fundamentals: minimize complexity (simple readable code over clever code, modular design); construct for verification (coding standards, log behaviors, restrict hard-to-understand constructs); anticipate change (extensibility, Agile/DevOps/CD); reuse assets via libraries/components instead of code clones; apply coding/exception-handling standards consistently.

## Decision Checklist

**Must Do**
- Confirm a test fails for the right reason BEFORE writing production code; write only the minimum to pass.
- Validate all public-routine inputs or document + enforce a precondition.
- Make every exception message carry the full context that led to it.
- Gate each new dependency on necessity + license + security.
- Keep cyclomatic complexity low and cover each independent path with a test.
- Encapsulate reusable logic in a library/component; never copy-paste across modules.

**Must Not Do**
- No empty catch blocks (log, re-throw, or handle explicitly).
- No production code ahead of a failing test; no untested speculative branches.
- No big-bang integration when incremental/CI is available.
- No input validation or side effects inside assertions (they compile out).
- No clever/obfuscated code or micro-optimization without profiling evidence.

## Anti-Patterns

| Anti-pattern | Why it fails |
|---|---|
| Code written before a failing test exists | Violates TDD; the test no longer proves anything |
| High cyclomatic complexity, thin tests | Untested paths ship as latent defects |
| Big-bang integration | Error location collapses across all components at once |
| Dependency sprawl | Unused/redundant deps enlarge attack surface and build time |
| Empty catch block | Silently swallows errors; no diagnostic trail |
| Defensive checks absent | Routine broken by invalid/untrusted input |
| Only the happy path coded + tested | Error, empty, and boundary states unhandled |
| Hardcoded user-facing strings | Cannot be translated or configured |
| Optimizing without a profiler | Effort spent off the real hot spot |

## Standards Referenced

| Standard | Purpose |
|---|---|
| IEEE Std 829-2008 | Software Test Documentation |
| IEEE Std 1517-2010 | Software Life Cycle Processes — Reuse Processes |
| ISO/IEC 12207 | Software Life Cycle Processes |
`,
  path: "resources/ch04-construction.md",
  title: "Software Construction",
  triggers: [
    "TDD",
    "assertion",
    "exception-handling",
    "API",
    "dependency",
    "CI",
    "cyclomatic-complexity",
    "defensive-programming"
  ] as const
};
