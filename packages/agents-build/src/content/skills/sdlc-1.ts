import { defineSkill } from "../../define.ts";

export const sdlc1 = defineSkill({
  content: `# Standalone SDLC Phase 1 (sdlc-1) - Requirements Gathering & SARA CLI Documenter

This skill acts as a requirements elicitation director and alignment checker. It conducts a structured, interactive user interview (similar to the \`/grill-me\` flow) to gather requirements based on **Phase 1 of the Software Development Lifecycle (Requirements & Analysis)**. Once requirements are gathered, it generates structured Markdown documents conforming to the **SARA CLI** (Solution Architecture Requirement for Alignment) specification, and validates their relationships.

---

## Phase 1 Reference & Alignment
This skill aligns with the following Phase 1 guidelines:
- [requirements-elicitation](file:///.agents/rules/requirements-elicitation.md) - Active stakeholder discovery and clarification loops.
- [requirements-attributes](file:///.agents/rules/requirements-attributes.md) - Requirements validation attributes (testability, unambiguity).
- [requirements-completeness](file:///.agents/rules/requirements-completeness.md) - Complete and consistent requirements validation criteria.
- [requirements-change-control](file:///.agents/rules/requirements-change-control.md) - Managing scope change requests and agreements.
- [requirements-prioritization](file:///.agents/rules/requirements-prioritization.md) - MoSCoW prioritization and value-cost tradeoffs.
- [requirements-traceability](file:///.agents/rules/requirements-traceability.md) - Mappings between requirements, implementation, and tests.
- [user-story-specification](file:///.agents/rules/user-story-specification.md) - BDD behavior specs via Given-When-Then criteria.
- [scope-matching](file:///.agents/rules/scope-matching.md) - Prioritizing work within budget and schedule constraints.
- [effort-estimation](file:///.agents/rules/effort-estimation.md) - COCOMO, function points, and calibration.
- [risk-management](file:///.agents/rules/risk-management.md) - Constructing risk registers and mitigation strategies.
- [software-lifecycles](file:///.agents/rules/software-lifecycles.md) - Choosing the appropriate lifecycle models and entry/exit criteria.
- [process-measurement](file:///.agents/rules/process-measurement.md) - Defect density and cycle time measurements.
- [professional-ethics](file:///.agents/rules/professional-ethics.md) - Public interest, professional competency, and code of conduct.
- [cost-benefit-analysis](file:///.agents/rules/cost-benefit-analysis.md) - Buy vs build, ROI, and technical debt valuations.

---

## SARA CLI (Solution Architecture Requirement for Alignment) Specification
SARA (https://github.com/cledouarec/sara) manages requirements and architecture documents as an interconnected graph using plain Markdown files with YAML frontmatter.

### Supported Commands
- \`sara init <file.md>\`: Initializes the SARA YAML metadata block in a markdown file.
- \`sara validate\` or \`sara check\`: Checks the graph's structural integrity (broken references, loops, orphans, duplicate identifiers).
- \`sara query <ID> [--downstream | --upstream]\`: Queries downstream/upstream trace paths from a specific item ID.

### SARA File Format & Frontmatter
SARA parses files with specific YAML headers to define nodes and relationships. The frontmatter MUST include:
- \`id\`: A unique string identifier, e.g. \`"SYSREQ-001"\` (system requirement), \`"UC-001"\` (use case), \`"SOL-001"\` (solution).
- \`type\`: Document type, e.g., \`"solution"\`, \`"use_case"\`, \`"system_requirement"\`.
- \`name\`: Human-readable name.
- Relationships (optional):
  - \`derives_from\`: List of parent requirement IDs (upstream).
  - \`is_satisfied_by\`: List of satisfying items (downstream).
  - \`depends_on\`: Sibling/external dependencies.

Example File Structure:
\`\`\`yaml
---
id: "SYSREQ-001"
type: "system_requirement"
name: "Authentication Timeout Limit"
derives_from:
  - "UC-001"
---

## Specification
The response time for user authentication must be within 500ms.
\`\`\`

---

## Step-by-Step Execution Plan

### Step 1: Elicitation & Requirements Gathering Interview
Conduct an interactive interview similar to the \`/grill-me\` flow. Ask the user clear, numbered questions (2-3 questions per turn to keep it highly interactive and conversational) to cover:
1. **Core Objectives**: What is the primary business goal of this feature/change? Who are the stakeholders (users, systems, administrators)?
2. **Persona & User Story Definitions**: Formulate user stories in the format: \`As a <persona>, I want <goal> so that <value>\`.
3. **Behavioral Acceptance Criteria**: Establish at least three distinct Given-When-Then scenarios per user story:
   - Happy path (standard successful flow).
   - Boundary/validation path (validation rules, boundary conditions).
   - Exception/error path (system error, database failure, external API timeout).
4. **Prioritization (MoSCoW)**: Map the requirements to Must-have, Should-have, Could-have, and Won't-have categories.
5. **Constraints & Risks**: Are there performance SLAs, security constraints, regulatory compliance rules (GDPR, HIPAA), or technical dependencies? Construct a risk register with mitigation strategies.

### Step 2: Ubiquitous Language Glossary
Create a dictionary of domain terms used in the prose and map them explicitly to codebase elements (database columns, endpoints, component names). Resolve any semantic conflicts or naming mismatches before writing code.

### Step 3: Write SARA-Compliant Documents
Write the gathered requirements as SARA-compatible Markdown files under a designated directory (e.g. \`docs/requirements/\`).
- Ensure every file contains well-formed YAML frontmatter.
- Make sure that IDs match exactly and there are no duplicate identifiers.

### Step 4: Validate and Verify the Graph
- Run \`sara validate\` or \`sara check\` to verify the integrity of the requirements graph.
- If there are any errors (broken links, loops, orphans), resolve them and re-run validation.

### Step 5: Baseline Freeze
Present a final summary of the requirements graph structure and trace paths to the user. Freeze the baseline in the implementation plan before initiating construction.
`,
  description:
    "Interactive requirements elicitation interview to gather structured requirements and generate SARA-compliant Markdown documentation.",
  name: "sdlc-1"
});
