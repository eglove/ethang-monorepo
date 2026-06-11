export const ch10Process = {
  content: `# Software Engineering Process (SWEBOK v4, Chapter 10)

> Scope: Concepts, life cycles, and process assessment for software engineering. Covers how processes are defined, categorized, adapted, monitored, and improved. Key standard: ISO/IEC/IEEE 12207:2017.

## When to Apply

- Selecting or tailoring an SDLC model for a project
- Defining, documenting, or auditing process stages and transitions
- Running a process assessment (PDCA, GQM, CMMI/ISO 33000)
- Evaluating Agile retrospective effectiveness
- Deciding between predictive, iterative, incremental, or evolutionary life cycles

## Key Definitions

| Term | Definition |
|---|---|
| Process | Set of interrelated activities transforming inputs into outputs while consuming resources [ISO 12207] |
| Software life cycle | Evolution of a system from conception through retirement, including all processes, activities, and tasks |
| SLCM (Software Life Cycle Model) | Standard guiding document from which a project-specific activity sequence is derived |
| SLCP (Software Life Cycle Process) | A specific process within a life cycle (e.g., verification, configuration management) |
| Process Reference Model | Definitions of processes in terms of purpose and outcomes plus architecture of relationships |
| Process Assessment Model | Model for assessing a specified process quality characteristic against a reference model |
| PDCA | Plan-Do-Check-Act; Shewhart-Deming empirical improvement paradigm |
| GQM | Goal-Question-Metric; Basili's measurement paradigm: goals drive questions, questions drive metrics |

## Life Cycle Model Selection

Select a model by matching project characteristics to model constraints. Stages are not sequential — transitions are part of the specification.

| Model | Requirements | Change tolerance | Delivery cadence | Risk profile |
|---|---|---|---|---|
| **Waterfall / V-model** | Fixed, fully known upfront | None (closed set) | Single release at end | High if requirements wrong |
| **Incremental** | Mostly known; closed before dev starts | Low between increments | Successive feature additions | Medium |
| **Iterative / Spiral** | Evolving; risk-driven | Medium; each iteration can adapt | Repeated cycles, risk-gated | Managed via risk checkpoints |
| **Evolutionary** | Introduced in successive steps | High | Continuous additions | Low per step |
| **Agile** | Emergent; open to change at any stage | High by design | Short iterations (sprints) | Managed via retrospectives |
| **Continuous/DevOps** | Stable core with rapid delivery | Very high | Automated releases to staging/prod | Managed via automation |

**Adaptation procedure (ISO/IEC/IEEE 24748-1, §2.8):**
1. Identify all relevant characteristics — product size/complexity, stakeholder needs, org context
2. Select applicable standards or internal organizational documents
3. Select development strategy, SLCM, stages, and processes
4. Document decisions and rationale (deviations from org standards must be recorded)

## Four Process Categories (ISO/IEC/IEEE 12207)

| Category | Examples |
|---|---|
| **Technical** | Requirements definition, architecture, design, implementation, integration, verification, validation, operation, maintenance, disposal |
| **Technical management** | Project planning, risk management, configuration management, measurement, quality assurance |
| **Organizational project-enabling** | Life cycle model management, portfolio management, HR management, knowledge management |
| **Agreement** | Acquisition process, supply processes |

## Life Cycle Stage Model (ISO/IEC/IEEE 24748-1)

| Stage | Purpose |
|---|---|
| Concept | Identify stakeholder needs; explore concepts; propose solutions |
| Development | Refine requirements; create solutions; build, verify, and validate |
| Production | Produce and test the system |
| Utilization | Operate to satisfy user needs |
| Support | Provide actions for satisfactory operation |
| Retirement | Follow established disposal procedures |

## Process Assessment and Improvement

### PDCA Procedure (Shewhart-Deming)

| Step | Action | Output |
|---|---|---|
| Plan | Set measurable goals; define process changes | Improvement hypothesis |
| Do | Execute the process; collect empirical data | Execution data |
| Check | Compare results against goals; identify gaps | Gap analysis |
| Act | Adjust process based on findings; feed back to Plan | Updated process definition |

Apply PDCA at every scale: release retrospectives, sprint retrospectives, and org-level assessments are all PDCA cycles. The Act step (change something) is mandatory — check-only loops are incomplete.

### GQM Procedure (Basili)

1. Define a **Goal** — measurable, linked to a decision (e.g., "reduce defect escape rate by 20%")
2. Derive **Questions** — whose answers indicate goal achievement (e.g., "What is defect density per sprint?")
3. Define **Metrics** — that answer each question (e.g., defects found post-release / story points delivered)
4. Collect data → evaluate effect → if positive, improvement confirmed

Rule: never define a metric without a linked goal. Metrics gathered only for reporting are waste.

### Framework-Based Assessment

| Framework | Dimensions assessed | Maturity levels |
|---|---|---|
| **CMMI v2.0** | Development, acquisition, services | 1 Initial → 2 Managed → 3 Defined → 4 Quantitatively Managed → 5 Optimizing |
| **ISO/IEC 33000 (SPICE)** | Process capability + organizational maturity | Capability: 0 Incomplete → 5 Innovating; Maturity: 1–5 |

ISO/IEC 33000 revises ISO/IEC 15504. Use Process Reference Model to describe what processes do; use Process Assessment Model to measure how well they do it.

### Agile Retrospectives

End-of-iteration retrospective procedure:
1. What went well? (keep)
2. What did not go well? (understand why)
3. What actions will we take? (documented, assigned, time-boxed)
4. Review prior actions (closed-loop — were last iteration's actions completed?)

Retrospectives without documented actions produce no improvement — they are discussion, not PDCA.

## Decision Checklist

**Must Do**
- [ ] Document the SLCM chosen with rationale before development starts
- [ ] Define life cycle stage transitions explicitly — who approves each transition
- [ ] Collect process and product metrics continuously during execution, not only at milestones
- [ ] Apply PDCA Act step: change at least one process element based on each retrospective
- [ ] Define GQM goals before selecting metrics — link every metric to a decision
- [ ] Record all life cycle adaptations and deviations from org standards with rationale

**Must Not Do**
- [ ] Leave SLCM selection implicit or undocumented
- [ ] Conduct retrospectives without producing documented, assigned actions
- [ ] Collect metrics with no linked goal or decision
- [ ] Treat Agile as permission to skip process definition — values do not replace process
- [ ] Conflate DevOps with CI/CD tooling adoption — DevOps is a collaboration and communication model first

## Anti-Patterns

| Anti-Pattern | Why it fails |
|---|---|
| Retrospectives with no actions recorded | PDCA loop is incomplete; mistakes repeat |
| Metrics gathered for reporting only | No process change possible; waste of collection effort |
| Agile treated as "no process" | Values and principles require process discipline; Agile Manifesto does not eliminate documents |
| SLCM undocumented | Future teams cannot audit, improve, or comply |
| DevOps = tool adoption only | DevOps requires organizational collaboration change; tools alone do not deliver it |
| Predictive vs. Agile as ideology | Model selection must be evidence-based, not dogmatic |
| Scaling Agile without coordination design | Inter-team dependencies are not handled by sprint cadence alone |

## Standards Referenced

| Standard | Subject |
|---|---|
| ISO/IEC/IEEE 12207:2017 | Software Life Cycle Processes |
| ISO/IEC/IEEE 24748-1:2018 | Life Cycle Management Guidelines |
| ISO/IEC/IEEE 24765:2017 | Systems and Software Engineering Vocabulary |
| ISO/IEC 33001:2015 | Process Assessment Concepts and Terminology |
| ISO/IEC/IEEE 32675:2022 | DevOps |
| ISO/IEC 29110 | Life Cycle Profiles for Very Small Entities |
`,
  path: "resources/ch10-process.md",
  title: "Software Engineering Process",
  triggers: [
    "SDLC",
    "Agile",
    "PDCA",
    "GQM",
    "CMMI",
    "Scrum",
    "life-cycle",
    "process-improvement"
  ] as const
};
