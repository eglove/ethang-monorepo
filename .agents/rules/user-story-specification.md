---
description: user stories, BDD, Given-When-Then, and functional specifications
trigger: model_decision
---

# User Story Specification

## 1. Domain Theory and Conceptual Foundations
In agile software development, requirements are represented as user stories to maintain stakeholder focus on user needs, business value, and collaborative discovery. As discussed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1 (Requirements) and Chapter 10 (Process), a user story is a high-level functional specification that captures the who, what, and why of a requirement in a structured format:

`As a <user persona/role>, I want <some functional goal> so that <some business benefit/value>.`

To make user stories actionable, verifiable, and testable, they must be accompanied by detailed acceptance criteria. SWEBOK v4 emphasizes that requirements must be validated against objective criteria before construction. In modern software engineering, this validation is achieved using Behavior-Driven Development (BDD) and the Given-When-Then specification template:
- **Given**: Establishes the initial state, preconditions, or system setup (e.g., "Given the customer's account balance is $50.00").
- **When**: Specifies the user action, triggering event, or system stimulus (e.g., "When the customer requests a $20.00 withdrawal").
- **Then**: Establishes the expected post-state, observable outputs, side-effects, or assertions (e.g., "Then the system shall dispense $20.00 and update the balance to $30.00").

BDD scenarios bridge the gap between human-readable requirements and executable code, serving as direct inputs for automated integration and acceptance test suites.

### 1.1 The INVEST Criteria for Quality User Stories
To ensure that a user story is well-formed and ready for construction, it must satisfy the INVEST criteria, an industry-standard framework aligned with SWEBOK requirements engineering principles:
- **Independent**: The story should be self-contained, with minimal dependencies on other stories, allowing it to be developed and delivered in any order.
- **Negotiable**: It is not a rigid contract; it is a placeholder for conversation. The details of implementation are co-created by the developer and stakeholder.
- **Valuable**: It must deliver clear, recognizable business value to the end user or client. Technical tasks should not be written as user stories but as engineering constraints.
- **Estimable**: The scope must be clear enough for developers to assess effort and complexity using relative sizing.
- **Small**: The story must fit within a single development iteration. Large stories ("epics") must be decomposed.
- **Testable**: The story must have clear, objective acceptance criteria that can be verified via automated tests.

### 1.2 Cognitive Value of Behavior-Driven Development (BDD)
Behavior-Driven Development extends Test-Driven Development by framing tests around user-visible behaviors rather than technical implementation details. By standardizing on the natural language Given-When-Then syntax, BDD establishes a "ubiquitous specification format" that business analysts, developers, and QA engineers can understand.

This syntax reduces translation errors:
- **Given** establishes the FSM state.
- **When** represents the transition trigger.
- **Then** asserts the expected post-state or side-effect.

By framing requirements as state transitions, developers can directly translate BDD prose into parameterized test arrays, ensuring complete behavioral coverage of the codebase.

### 1.3 Behavioral Modeling of Exception Paths
A common failure mode in Agile construction is the neglect of non-happy path behaviors. User stories often focus heavily on functional value (e.g. successful checkouts), leaving developers to define error behaviors ad-hoc. BDD mandates that exception flows are specified with the same rigor as successful pathways. If an external API call fails, the requirement must define:
1. Under what conditions a retry should occur.
2. When to display a recovery prompt.
3. How to preserve intermediate user inputs to prevent data loss.
4. When to transition the UI to a terminal error configuration.

## 2. Standard Operating Procedures (SOP)
The agent must apply this user story and BDD specification process to all tasks using the following procedure:

### Step 2.1: Persona Definition
Identify the specific user classes, system roles, or API consumers involved in the task. Avoid using the generic term "user" if specific roles (e.g., "anonymous visitor", "authenticated subscriber", "system administrator") exist.

### Step 2.2: User Story Writing
Compose the user story statement: `As a <persona>, I want <goal> so that <value>.` Verify that the "goal" represents a functional capability and the "value" represents a clear business benefit, not just a restatement of the goal.

### Step 2.3: Acceptance Criteria Scenario Mapping
For each user story, draft at least three distinct behavioral scenarios using the Given-When-Then format:
- **Scenario 1: Happy Path**: The successful execution of the primary flow under normal conditions.
- **Scenario 2: Boundary/Validation Path**: Execution gating at input validation limits or business rules boundaries.
- **Scenario 3: Exception/Error Path**: The system's response to errors, network timeouts, or invalid states.

To enforce these behaviors, developers can implement sanitization and mapping classes. Below is an example of an input validator class demonstrating the implementation of explicit member accessibility, arrow function methods, bracket notation index-signature property access, and no explicit return types:

```typescript
export type ValidationDetails = {
  sanitized: string;
  hasErrors: boolean;
};

export class StorySanitizer {
  private fallbackVal: string;

  public constructor(fallback: string) {
    this.fallbackVal = fallback;
  }

  public cleanText = (payload: Record<string, string>) => {
    const rawContent = payload["content"];

    if (rawContent === undefined) {
      return {
        hasErrors: true,
        sanitized: this.fallbackVal,
      };
    }

    const trimmed = rawContent.trim();
    if (trimmed === "") {
      return {
        hasErrors: true,
        sanitized: this.fallbackVal,
      };
    }

    return {
      hasErrors: false,
      sanitized: trimmed,
    };
  };
}
```

### Step 2.4: Executable Test Mapping
Map each Given-When-Then scenario directly to a test case in the integration test suite (e.g., `feature.integration.test.ts`). The "Given" clause corresponds to the test setup (seeding the test DB, mocking query clients); the "When" clause corresponds to the stimulus trigger (rendering components, requesting routes); and the "Then" clause corresponds to the assertions (`expect().toBe()`).

Use Vitest's parameterized `it.each` to map scenarios to tests directly, avoiding copy-pasted blocks. Ensure all functions use arrow syntax:

```typescript
describe("StorySanitizer BDD Scenarios", () => {
  const sanitizer = new StorySanitizer("default-text");

  it.each([
    {
      scenario: "Given an empty payload",
      input: {},
      expectedContent: "default-text",
      expectedError: true,
    },
    {
      scenario: "Given an empty string",
      input: { content: "" },
      expectedContent: "default-text",
      expectedError: true,
    },
    {
      scenario: "Given a valid content string",
      input: { content: "User story title" },
      expectedContent: "User story title",
      expectedError: false,
    },
  ])("$scenario -> When cleaned -> Then expectedContent is $expectedContent", ({ input, expectedContent, expectedError }) => {
    const result = sanitizer.cleanText(input);
    expect(result["sanitized"]).toBe(expectedContent);
    expect(result["hasErrors"]).toBe(expectedError);
  });
});
```

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria before finalizing user story specifications:

- [ ] **Persona Specificity**: Is the persona defined as a specific user role or system actor instead of a generic "user"?
- [ ] **Functional Goal**: Does the "I want" clause specify a clear, actionable functional capability?
- [ ] **Business Benefit**: Does the "so that" clause articulate a distinct business value or user benefit?
- [ ] **Given-When-Then Format**: Are all acceptance criteria written using the formal Given-When-Then structure?
- [ ] **Precondition Isolation**: Does the "Given" clause specify only the pre-existing system state, configurations, and database seeds?
- [ ] **Stimulus Isolation**: Does the "When" clause contain exactly one triggering user action or event?
- [ ] **Postcondition Assertions**: Does the "Then" clause specify verifiable assertions and observable side-effects?
- [ ] **Three Scenario Minimum**: Are there at least three scenarios (happy path, validation path, error path) documented for each story?
- [ ] **Test Co-location**: Does every scenario map to a co-located integration or unit test case?
- [ ] **Ubiquitous Language**: Does the story and scenario text align with the approved project glossary?
- [ ] **No Implementation Details**: Are the scenarios written in business domain terms, avoiding UI widget details (e.g., "clicks the blue button")?
- [ ] **Atomicity**: Is the user story focused on a single indivisible feature, or does it need to be split into multiple smaller stories?
- [ ] **State Coverage**: Do the scenarios cover all relevant FSM states (loading, empty, loaded, error)?
- [ ] **Exception Handling**: Is the system behavior during server crashes or database failures explicitly specified in an error scenario?
- [ ] **Review Validation**: Has the user reviewed and approved the Given-When-Then scenarios before coding?
- [ ] **INVEST Adherence**: Has each user story been evaluated against the INVEST matrix (Independent, Negotiable, Valuable, Estimable, Small, Testable)?
- [ ] **No Forbidden Terminology**: Has the story text been verified to contain no restricted words?
