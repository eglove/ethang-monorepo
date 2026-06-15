---
description: requirements validation attributes, testability, and unambiguity
trigger: model_decision
---

# Requirements Attributes

## 1. Domain Theory and Conceptual Foundations
Individual software requirements must possess specific quality attributes to ensure they are actionable, verifiable, and baseline-ready. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1 (Software Requirements), requirements validation is the process of checking that the requirements define the right system. Verifying the quality attributes of individual requirements is the first line of defense against specification-level defects. 

Empirical research in software engineering has consistently shown that requirements defects (such as ambiguity, incompleteness, or contradictions) are the most expensive to correct. A requirements defect that escapes to production can cost up to 100 times more to fix than if it had been detected during the requirements phase. Therefore, validation is a critical gate in the software construction lifecycle.

Each requirement statement must exhibit the following critical quality attributes:
1. **Unambiguity**: The requirement must have exactly one possible interpretation. Natural language requirements are highly susceptible to multiple interpretations, which must be resolved by using precise templates and glossary-aligned vocabulary.
2. **Testability (Verifiability)**: A requirement is testable if and only if there exists an objective, cost-effective, and repeatable process to verify that the implemented software satisfies it. Non-testable requirements (e.g., "the UI shall be fast") must be translated into quantifiable metrics (e.g., "the API shall respond within 200ms under 100 concurrent requests").
3. **Atomicity**: The requirement must encapsulate a single, indivisible functional capability or constraint. Non-atomic requirements (using compound conjunctions like "and", "or") introduce test path complexity and must be decomposed into separate, atomic statements.
4. **Feasibility**: The requirement must be technically and financially feasible within the project's constraints (budget, timeline, technology stack).
5. **Traceability**: The requirement must be uniquely identifiable (e.g., using a prefix like `REQ-01`) to enable mapping from requirement to design, implementation, and test cases.
6. **Consistency**: The requirement must not conflict with any other requirements.
7. **Completeness**: The requirement must address all relevant input states, boundary conditions, and exceptional failure scenarios.

### 1.1 Vertical and Horizontal Traceability
SWEBOK v4 highlights two dimensions of traceability:
- **Horizontal Traceability**: The relationship between requirements at the same level of abstraction (e.g., showing how a functional requirement links to a corresponding non-functional security constraint).
- **Vertical Traceability**: The relationship between requirements at different levels of abstraction (e.g., mapping a high-level system requirement to a design component, a specific line of code, and a verifying unit test).

By establishing robust vertical traceability, engineers can perform impact analysis whenever a requirement changes, identifying exactly which files and tests must be updated.

## 2. Standard Operating Procedures (SOP)
The agent must verify and format all requirements to comply with quality attributes before beginning development.

### Step 2.1: Audit for Ambiguity and Vague Terms
Review the draft requirements to identify and remove subjective adjectives:
1. **Locate Vague Words**: Find words like "fast", "easy", "secure", "responsive", "robust", or "user-friendly".
2. **Define Quantifiable Thresholds**: Replace them with specific, measurable metrics:
   - *Ambiguous*: *"The database queries shall be fast."*
   - *Quantified*: *"When a search is requested, the ProfileRepository shall return matching records within 150ms under peak load."*

### Step 2.2: Verifying Atomicity
Decompose compound requirements into separate, atomic statements:
1. **Locate Conjunctions**: Check for "and", "or", "as well as", or "in addition to".
2. **Decompose**: Split the statement:
   - *Compound*: *"The AccountController shall validate the user credentials and log the login event."*
   - *Atomic 1*: *"When login is requested, the AccountController shall validate user credentials."*
   - *Atomic 2*: *"When credentials are validated, the AccountController shall log the login event."*

### Step 2.3: Feasibility Assessment in Serverless Environments (Cloudflare Workers)
When writing requirements for serverless platforms, engineers must assess feasibility against platform-specific execution constraints:
1. **CPU Execution Time**: Ensure processing requirements can execute within the 50ms (or 10ms free tier) CPU limit.
2. **Subrequest Bounds**: Ensure the request sequence does not exceed the maximum allowed HTTP subrequests per invocation (e.g., 50 subrequests).
3. **Memory Footprint**: Verify that in-memory operations (like large CSV parsing or JSON buffers) do not exceed the worker limit of 128MB.
4. **Cold Start Mitigation**: Requirements for interactive UI responses must limit dependency sizes to minimize startup latency.

### Step 2.4: Building the Traceability Matrix
To ensure traceability, map every requirement ID to its corresponding implementation file and test case:
1. **Create Table**: Add a "Traceability Matrix" section in the execution plan:

| Requirement ID | Description | Source File | Test Case File |
|---|---|---|---|
| REQ-01 | Encrypt PII | `profile-service.ts` | `profile-service.test.ts` |
| REQ-02 | Rate limit API | `router.ts` | `router.test.ts` |

### Step 2.5: Tracing Requirements to Code & Test Cases
Below is an example showing how requirements map directly to source code and tests.

**Requirement REQ-03**: *"When a user requests a user profile, the ProfileService shall fetch the profile record from the database and redact the social security number."*

1. **Source Implementation (TypeScript)**:
   ```typescript
   interface UserProfile {
     id: string;
     name: string;
     socialSecurityNumber: string;
   }

   class ProfileService {
     private database: MockDatabase;

     public constructor(database: MockDatabase) {
       this.database = database;
     }

     public getProfile = async (id: string): Promise<Omit<UserProfile, "socialSecurityNumber">> => {
       const user = await this.database.fetchUser(id);
       if (undefined === user) {
         throw new Error("User not found");
       }
       const { socialSecurityNumber, ...redactedProfile } = user;
       return redactedProfile;
     };
   }

   class MockDatabase {
     private profiles: Record<string, UserProfile> = {
       "1": { id: "1", name: "Alice", socialSecurityNumber: "123-456-7890" }
     };

     public fetchUser = async (id: string): Promise<UserProfile | undefined> => {
       return this.profiles[id];
     };
   }
   ```

2. **Verifying Test Suite (Vitest)**:
   ```typescript
   import { describe, expect, it } from "vitest";

   describe("ProfileService REQ-03 Verification", () => {
     it("should return the user profile with the social security number redacted", async () => {
       const database = new MockDatabase();
       const service = new ProfileService(database);
       const result = await service.getProfile("1");
       
       expect(result["name"]).toBe("Alice");
       expect(result).not.toHaveProperty("socialSecurityNumber");
     });

     it("should throw an error if the user profile does not exist", async () => {
       const database = new MockDatabase();
       const service = new ProfileService(database);
       
       await expect(async () => {
         await service.getProfile("2");
       }).rejects.toThrow("User not found");
     });
   });
   ```

## 3. Agent Compliance Checklist
The agent must verify that all requirements exhibit the necessary quality attributes before finalizing the specification:

- [ ] **Unambiguity Verified**: Has the agent verified that each requirement has exactly one logical interpretation?
- [ ] **Testability Confirmed**: Is there an objective, repeatable process to verify every requirement?
- [ ] **Quantifiable Metrics**: Are performance, security, and quality constraints expressed in measurable terms?
- [ ] **Atomicity Check**: Does each requirement statement specify exactly one action or constraint?
- [ ] **No Conjunctions**: Are compound requirement conjunctions ("and" / "or") completely eliminated?
- [ ] **Feasibility Audited**: Has the agent verified that all requirements are technically feasible in the stack?
- [ ] **Unique Identifiers**: Does every requirement statement have a unique ID (e.g. `REQ-01`)?
- [ ] **Traceability Matrix Complete**: Are all requirement IDs mapped to implementation files and tests?
- [ ] **Active Voice Enforced**: Are all statements written in the active voice, identifying the actor first?
- [ ] **Binding Operator Used**: Do all requirements use the binding verbal operator "shall"?
- [ ] **No Implementation Bias**: Do the requirements specify *what* the system does without dictating *how* to code it?
- [ ] **Glossary Alignment**: Are all terms in the requirements aligned with the Ubiquitous Language glossary?
- [ ] **Error Paths Addressed**: Are exceptional and error conditions written as separate, verifiable requirements?
- [ ] **Stability Assessed**: Has the volatility risk of each requirement been evaluated?
- [ ] **Arrow Functions Enforced**: Are all mock methods in the verification examples written as arrow functions?
- [ ] **No Explicit Return Types**: Do all TypeScript test helpers in the examples omit explicit return types?
- [ ] **Explicit Member Modifiers**: Are mock class properties decorated with explicit public/private modifiers?
- [ ] **Bracket notation**: Are dynamic property checks in the test examples written using bracket notation?
- [ ] **Void assertion wrapping**: Are void operations verified using `expect(() => ...).not.toThrow()`?
- [ ] **No Forbidden Terminology**: Has the requirements text been scanned to verify zero forbidden words?
- [ ] **No Git Commit executed**: Did the agent ensure that no git commits or pushes were made?
- [ ] **SWEBOK Requirements Grounding**: Does the requirements quality check align with SWEBOK v4 Chapter 1?
- [ ] **Serverless Platform Checked**: Have Worker bounds (memory, CPU, subrequests) been verified?
- [ ] **Vertical Traceability Validated**: Is there a trace from user inputs to database transactions for every route?
- [ ] **Consistency Audit Complete**: Has the agent checked for conflicting attributes (e.g. speed vs. encryption level)?
