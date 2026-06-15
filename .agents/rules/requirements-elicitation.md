---
description: active discovery, ubiquitous language, and stakeholder clarification loops
trigger: model_decision
---

# Requirements Elicitation

## 1. Domain Theory and Conceptual Foundations
Software requirements elicitation is the critical, active engineering process of identifying, discovering, and capturing the requirements of a software system from diverse sources. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, elicitation is not a passive task of collecting ready-made specifications, but an active, cognitive, and collaborative discovery process. Requirements are often hidden, unstated, or poorly understood by stakeholders, requiring systematic engineering techniques to bring them to light.

Requirements emerge from a wide variety of sources, which SWEBOK v4 classifies as:
- **Stakeholders**: Users, customers, sponsors, domain experts, software developers, system administrators, and operations staff.
- **Legacy Systems**: Existing applications, physical procedures, operational databases, and historical document archives.
- **Operational Environment**: Underlying hardware platforms, operating systems, network topologies, memory constraints, and third-party API dependencies.
- **Organizational & Regulatory Context**: Corporate compliance rules, industry standards (e.g. ISO/IEC), legal regulations (GDPR, CCPA), and security frameworks.

SWEBOK v4 defines five primary elicitation techniques that must be deployed depending on the project context:
1. **Interviews**: Structured (guided by a formal questionnaire) or unstructured (open-ended discussions) interviews are highly effective for uncovering high-level goals, organizational rules, and user concerns. However, interviews are subject to interviewer bias and stakeholders may struggle to articulate implicit or habitual tasks.
2. **Scenarios**: Concrete, step-by-step descriptions of specific operational flows, use cases, and storyboards. Scenarios ground abstract concepts in user-visible steps, making it easier for stakeholders to evaluate and refine requirements.
3. **Prototypes**: Interactive mockups (ranging from low-fidelity wireframes to high-fidelity HTML/CSS screens) used to validate user expectations, test usability assumptions, and uncover unstated requirements. While powerful, prototypes run the risk of stakeholders mistaking the mockup for a nearly complete system, leading to unrealistic schedule expectations.
4. **Facilitated Sessions**: Joint Application Design (JAD) workshops and alignment meetings where cross-functional stakeholders collaborate. Facilitated sessions are essential for resolving conflicting requirements, building consensus, and securing stakeholder alignment.
5. **Observation**: Passive observation (watching users perform tasks in their actual environment) or active protocol analysis (where users think aloud while performing tasks). Observation is invaluable for identifying unarticulated needs, workarounds, and environmental constraints.

### 1.1 Tacit Knowledge and the Cognitive Dimension of Elicitation
A major hurdle in requirements elicitation is the discovery of "tacit knowledge"—information that stakeholders possess and utilize unconsciously but fail to articulate during passive questioning. Business users and administrators develop highly automated habits and shortcuts that they assume are "obvious" or "common sense." If the engineer relies solely on structured interviews, these critical operational constraints remain unrecorded, resulting in gaps in the final application logic.

To mitigate this, engineers must combine verbal interviews with active protocol analysis and interactive prototypes. By prompting the user to perform tasks while describing their thoughts aloud, the engineer can uncover latent constraints, error recovery steps, and implicit system expectations (such as default inputs, validation ranges, and keyboard navigation shortcuts).

### 1.2 Bounded Contexts and Semantic Alignment
Crucial to requirements elicitation is the establishment of a Ubiquitous Language—a Domain-Driven Design (DDD) principle. A Ubiquitous Language is a shared, unambiguous vocabulary structured around the domain model and used consistently by all team members (developers, analysts, domain experts) to connect business prose with the software codebase (components, handlers, schema columns). This language prevents semantic drift, where terms like "customer" and "user" are used interchangeably, leading to logical errors in the software.

Elicitation activities must overcome three common classes of problems defined in SWEBOK:
- **Problems of Scope**: The boundary of the system is ill-defined, or stakeholders specify unnecessary detail or gold-plating.
- **Problems of Understanding**: Stakeholders are unsure of what they need, have poor understanding of computer capabilities, use different vocabularies, or have difficulty expressing tacit knowledge.
- **Problems of Volatility**: Requirements change over time as the organization or business environment evolves.

## 2. Standard Operating Procedures (SOP)
To execute requirements elicitation in this workspace, the agent must follow this step-by-step Standard Operating Procedure:

### Step 2.1: Elicitation Source Mapping
Before any code is modified, the agent must identify and inventory all requirements sources. This includes scanning the task description, analyzing the existing directory structures, examining package manifests, and identifying any legacy code that the new feature must interface with. The agent must create a "Requirements Source List" in the implementation plan.

### Step 2.2: Ubiquitous Language Glossary Construction
The agent must extract all domain-specific nouns and verbs from the user request. A glossary table must be constructed comparing these terms to the codebase vocabulary:
- Identify if the user request uses terms that mismatch the existing codebase (e.g., the user requests a "user account freeze" but the schema uses `billing_freeze` and the handler is named `suspendSubscription`).
- Create a translation map to align the prose with the codebase, and present this to the user for confirmation.
- Ensure all new code (variables, functions, components, API paths) uses the vocabulary defined in the approved glossary.

Here is a TypeScript utility demonstrating vocabulary translation mapping from user-facing domain terms to system-level schema properties. Note the use of arrow functions, lack of explicit return types, explicit member accessibility, and bracket notation for index signatures:

```typescript
export type DomainRequest = {
  customerName: string;
  freezeRequested: string;
};

export class UserTermMapper {
  private suffix: string;

  public constructor(suffix: string) {
    this.suffix = suffix;
  }

  public mapToSchema = (request: DomainRequest) => {
    const rawName = request["customerName"];
    const shouldFreeze = request["freezeRequested"] === "true";

    return {
      db_account_state: shouldFreeze ? "SUSPENDED" : "ACTIVE",
      db_user_fullName: `${rawName}_${this.suffix}`,
    };
  };
}
```

### Step 2.3: Scenario & Storyboard Definition
The agent must translate the functional requirements into concrete Given-When-Then scenarios. For UI changes, the agent must sketch the interface layout using markdown tables or generate mockups using standard components, detailing the state transitions (loading, success, error, empty). For complex data flows, a storyboard showing the sequence of database writes, API calls, and events must be written.

### Step 2.4: Stakeholder Interview & Conflict Resolution
The agent must present the drafted scenarios, glossary, and UI mockups to the user. If any requirements are underspecified, ambiguous, or in conflict, the agent must formulate a single, clear multiple-choice or write-in question to resolve the ambiguity. The agent must not guess or proceed with coding until the user has explicitly approved the design assumptions.

### Step 2.5: Requirements Baseline Freeze
Once the user approves the scenarios and mockups, the requirements must be baselined and written into the implementation plan. This baseline serves as the formal specification. Any future modifications to these requirements must go through the formal change control process.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria before completing the elicitation phase:

- [ ] **Source Inventory**: Have all requirements sources (stakeholders, code, environment, regulations) been identified and listed?
- [ ] **Elicitation Techniques**: Did the agent use appropriate elicitation techniques (scenarios for behavior, mockups for UI, interviews for open questions)?
- [ ] **Ubiquitous Language**: Is there a documented glossary mapping user prose to the codebase vocabulary?
- [ ] **Semantic Resolution**: Have all vocabulary mismatches and naming conflicts been resolved and approved by the user?
- [ ] **Behavioral Scenarios**: Are all functional requirements represented by at least one Given-When-Then behavioral scenario?
- [ ] **UI Mockups & States**: Has an approved mockup showing loading, empty, loaded, and error states been created for every new UI view?
- [ ] **Ambiguity Resolution**: Were all open questions, assumptions, and constraints explicitly approved by the user?
- [ ] **Baseline Freeze**: Are the requirements frozen in the implementation plan and mapped to a Traceability Matrix?
- [ ] **Sizing & Constraints**: Has the agent verified that the size of the elicited requirements matches the project schedule and technical constraints?
- [ ] **Error Boundaries**: Are the error paths and exception bounds explicitly documented in the scenarios?
- [ ] **Tacit Knowledge Discovery**: Did the agent verify that unstated user assumptions (e.g. keyboard navigation, default values, cancellation states) are explicitly captured?
- [ ] **Gold-Plating Prevention**: Has the agent verified that no unnecessary features or unrequested scope items have been introduced into the design?
- [ ] **Context Boundary Check**: Have the system boundaries been clearly defined and verified as distinct from external microservices or third-party gateways?
- [ ] **Consistency Audit**: Has the agent verified that none of the newly elicited requirements contradict existing system rules?
- [ ] **Security Compliance**: Did the elicitation process capture all data protection, authentication, and authorization rules required for the feature?
- [ ] **Operational Bounds**: Has the agent documented the system performance expectations (e.g. timeout limits, concurrent users, expected payload sizes)?
- [ ] **Feedback Loops**: Has the agent confirmed that the user has reviewed and explicitly approved the Ubiquitous Language translation map?
- [ ] **Regulatory Alignment**: Have all compliance rules (e.g. data retention policy, privacy mandates) relevant to the feature been cataloged?
