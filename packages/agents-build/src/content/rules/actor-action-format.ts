import { defineRule } from "../../define.ts";

export const actorActionFormat = defineRule({
  content: `# Actor-Action Format

## 1. Domain Theory and Conceptual Foundations
Software requirements specifications written in natural language are historically prone to ambiguity, redundancy, and semantic drift. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1 (Software Requirements), standardizing the representation of requirements using structured templates is a primary defense against these defects. One of the most effective structural notations is the Actor-Action format (often referred to as the "shall" specification template), which imposes a strict grammatical hierarchy on each requirement statement.

The Actor-Action template consists of four fundamental components:
1. **Triggering Event**: The specific input, state change, schedule event, or system signal that initiates the requirement (e.g., "When a payment request is received").
2. **Actor**: The specific user role, automated process, database repository, system module, or external gateway that executes the requirement. The actor must be a concrete, identifiable entity within the system's boundary (e.g., "the billing handler").
3. **Action**: A single, active, and verifiable operation that the actor must perform (e.g., "shall record a pending transaction").
4. **Condition/Qualification**: Gating conditions, exceptions, business rules, or constraints that modify or bypass the action (e.g., "unless the account is suspended").

### 1.1 The "Shall" Verbal Operator
SWEBOK v4 highlights the importance of precise verbal operators in specifications:
- **Shall**: Denotes a binding requirement that must be implemented and verified. All functional requirements in this workspace must use "shall".
- **Should**: Denotes a non-binding recommendation or preference.
- **May**: Denotes an optional, allowable capability.

By restricting all requirement statements to the active voice and the "shall" verbal operator, engineers eliminate ambiguity about *who* is performing the action and *whether* it is optional. In modal logic terms, "shall" acts as a necessity operator \\(\\Box\\), stating that in all reachable execution paths where the triggering event and conditions are satisfied, the action must hold.

### 1.2 Verifiability and Atomicity
A requirement is verifiable if and only if there exists a finite, cost-effective process to prove that the software meets it. To ensure verifiability, requirements must be atomic—each statement must contain exactly one actor and one action. Compound requirements joined by conjunctions (e.g., "and", "or") introduce test path complexity and must be decomposed into separate, atomic Actor-Action statements. For example, "The user service shall authenticate the credentials and create a session" contains two distinct actions that must be split into two atomic requirements.

### 1.3 Linguistic Analysis of Vagueness
Requirement engineering must purge natural language of subjective qualifiers. Terms like "fast", "secure", "user-friendly", and "robust" cannot be translated into binary test assertions. Instead, they must be converted into measurable thresholds (e.g., "shall respond within 200 milliseconds", "shall encrypt the payload using AES-256 in GCM mode").

## 2. Standard Operating Procedures (SOP)
The agent must format all functional requirements in the execution plan using the Actor-Action syntax.

### Step 2.1: Grammatical Template Construction
Construct each requirement statement using the following syntax structure:
\`\`\`markdown
[Triggering Event], [Actor] shall [Action] [Condition/Qualification].
\`\`\`
*Example*: *"When the user clicks submit, the FormValidator shall validate the email field using the email regex unless the feature flag is disabled."*

### Step 2.2: Isolating and Verifying Actors
Ensure the Actor is a specific, defined class, module, database proxy, or user role.
- **Bad**: *"The system shall save the user profile."* (Vague actor "the system").
- **Good**: *"When the save button is clicked, the ProfileRepository shall insert the profile record into the database."*

### Step 2.3: Verification Mapping
For every Actor-Action statement, specify the corresponding test suite and assertion:
1. **Identify SUT**: The Actor maps to the System Under Test (SUT).
2. **Identify Stimulus**: The Triggering Event maps to the test method invocation or event trigger.
3. **Identify Assertion**: The Action and Condition map to the test assertions:
   \`\`\`typescript
   it("should save profile on click (REQ-01)", async () => {
     // Triggering Event
     await profileController.save(profileData);
     // Assertion verifying the Action
     expect(profileRepository["insert"]).toHaveBeenCalledWith(profileData);
   });
   \`\`\`

### Step 2.4: Comprehensive Stack Mapping (React, Hono, Drizzle)
To illustrate the complete lifecycle of a requirement, let us look at how an Actor-Action requirement is realized across a modern web stack:

**Requirement REQ-02**: *"When a user submits the signup form, the AuthHandler shall insert a new user record into the database, unless the email already exists in the database."*

1. **Frontend UI Component (React)**:
   \`\`\`typescript
   import React from "react";

   interface SignupFormProps {
     onSubmit: (email: string) => Promise<void>;
   }

   export const SignupForm = ({ onSubmit }: SignupFormProps) => {
     const [email, setEmail] = React.useState("");

     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       onSubmit(email).catch(() => {});
     };

     return (
       <form onSubmit={handleSubmit}>
         <input 
           type="email" 
           value={email} 
           onChange={(e) => { setEmail(e.target.value); }} 
         />
         <button type="submit">Sign Up</button>
       </form>
     );
   };
   \`\`\`

2. **Backend API Handler (Hono)**:
   \`\`\`typescript
   import { Hono } from "hono";
   
   interface Env {
     Variables: {
       database: MockDb;
     };
   }

   class MockDb {
     public findUserByEmail = async (email: string) => {
       return undefined;
     };
     public createUser = async (email: string) => {
       return { id: 1, email };
     };
   }

   export const authRouter = new Hono<Env>();

   authRouter.post("/signup", async (c) => {
     const body = await c.req.json();
     const db = c.var["database"];
     const existingUser = await db.findUserByEmail(body["email"]);
     if (undefined !== existingUser) {
       return c.json({ error: "Email already exists" }, 400);
     }
     const user = await db.createUser(body["email"]);
     return c.json(user, 201);
   });
   \`\`\`

3. **Database Repository & Verification (Vitest)**:
   \`\`\`typescript
   import { vi } from "vitest";

   class MockAuthRepository {
     private mockUsers: string[];

     public constructor() {
       this.mockUsers = [];
     }

     public findUserByEmail = async (email: string) => {
       return this.mockUsers.includes(email) ? { email } : undefined;
     };

     public createUser = async (email: string) => {
       this.mockUsers.push(email);
       return { id: this.mockUsers.length, email };
     };
   }

   describe("AuthHandler REQ-02 verification", () => {
     it("should create a new user when email does not exist", async () => {
       const repository = new MockAuthRepository();
       const email = "test@example.com";
       const result = await repository.createUser(email);
       expect(result["email"]).toBe(email);
     });

     it("should return existing user if email is present", async () => {
       const repository = new MockAuthRepository();
       const email = "test@example.com";
       await repository.createUser(email);
       const result = await repository.findUserByEmail(email);
       expect(result?.["email"]).toBe(email);
     });
   });
   \`\`\`

## 3. Agent Compliance Checklist
The agent must verify that all requirements comply with the Actor-Action format:

- [ ] **Shall Operator Used**: Do all requirement statements use the binding verbal operator "shall"?
- [ ] **No Weak Operators**: Are non-binding words like "should", "must", or "will" completely avoided?
- [ ] **Active Voice**: Are all statements written in the active voice, identifying the actor first?
- [ ] **Defined Actor**: Is the actor a specific, identifiable module, class, or user role instead of "the system"?
- [ ] **Single Action**: Does each requirement statement contain exactly one active verb?
- [ ] **Atomicity Verification**: Have all compound requirements been split into separate, atomic statements?
- [ ] **Trigger Specified**: Is the triggering event clearly defined as a state change, input, or schedule?
- [ ] **Quantifiable Actions**: Are all actions measurable and verifiable via automated testing?
- [ ] **Subjective Term Audit**: Have all vague terms (e.g., "fast", "efficient", "responsive") been eliminated?
- [ ] **Condition Bounding**: Are all conditional clauses ("unless", "if") bounded by specific variables or states?
- [ ] **Requirement IDs**: Does each Actor-Action requirement have a unique identifier (e.g., \`REQ-01\`)?
- [ ] **Verification Mapping**: Is every requirement statement mapped to a specific test case in the plan?
- [ ] **Arrow Functions Enforced**: Are the mock controllers in the verification plan written using arrow functions?
- [ ] **No Explicit Return Types**: Do all TypeScript test helpers in the plan omit explicit return types?
- [ ] **Explicit Member Modifiers**: Are mock class properties decorated with explicit public/private modifiers?
- [ ] **Bracket notation**: Are dynamic property checks in the test examples written using bracket notation?
- [ ] **Void assertion wrapping**: Are void actions verified using \`expect(() => ...).not.toThrow()\`?
- [ ] **No Forbidden Terminology**: Has the requirement text been scanned to ensure zero forbidden words are present?
- [ ] **No Git Commit executed**: Did the agent ensure that no git commits or pushes were made?
- [ ] **SWEBOK Requirements Grounding**: Does the requirements design align with SWEBOK v4 Chapter 1 standards?
- [ ] **Triggering Event Separation**: Is the triggering event separated from the actor by a comma?
- [ ] **Verification Plan Inclusion**: Are these requirements documented in the implementation plan's verification section?
- [ ] **No Unrequested Resets**: Are there no global git resets or destructive operations proposed?`,
  description:
    "actor-action requirements formatting and natural language precision",
  filename: "actor-action-format",
  trigger: "model_decision"
});
