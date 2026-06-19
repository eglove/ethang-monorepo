import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringFoundationsRootCauseAnalysis = defineRule({
  content: [
    {
      level: 1,
      text: "Engineering Foundations: Root Cause Analysis",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Root Cause Analysis (RCA) is a disciplined class of problem-solving methods designed to identify the underlying drivers of undesirable outcomes. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 18, Section 9, the primary objective of RCA is to determine why and how an event occurred, enabling organizations to implement permanent corrective actions rather than simply treating immediate symptoms. In software engineering, addressing only the visible symptoms (such as patching a bug without fixing the process defect that introduced it) leads to recurring failures, technical debt, and process inefficiency.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 The Roles of RCA in Software Projects",
      type: "header"
    },
    {
      text: "Root Cause Analysis plays four critical roles within the lifecycle of systems and software development:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Identifying the Real Problem**: At the beginning of the engineering process, the visible problem presented by stakeholders is often not the actual issue needing a solution. RCA helps engineers drill down to discover the core problem, preventing wasted effort on incorrect solutions."
        },
        {
          text: "**Exposing Underlying Risk Drivers**: By identifying what factors lead to historical failures, RCA supports proactive project risk assessments. This allows teams to identify vulnerability vectors before they manifest as active incidents."
        },
        {
          text: "**Software Process Improvement**: Systematically analyzing operational bottlenecks or deployment failures reveals targeted opportunities to improve the organizational engineering process."
        },
        {
          text: "**Defect Causal Analysis**: Investigating code defects to discover how they bypassed quality assurance gates enables engineers to harden test suites, build compilers, and improve code review criteria. In a modern continuous delivery pipeline, defect causal analysis requires analyzing not just the code defect, but why static analysis, unit test suites, integration tests, and manual verification stages failed to detect the defect before release."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Taxonomy of Root Cause Analysis Techniques",
      type: "header"
    },
    {
      text: "RCA utilizes various analytical techniques, which can be broadly categorized as backward-chaining (reasoning from effect back to cause) or forward-chaining (reasoning from failure mode forward to effect).",
      type: "text"
    },
    {
      items: [
        {
          text: "**Change Analysis**: This technique compares a situation that resulted in an undesirable outcome with a similar situation that went well. The core assumption is that the root cause lies in the differences between the two scenarios. By isolating these differences, engineers can locate the variables responsible for the failure."
        },
        {
          text: '**The 5-Whys Technique**: Starting with the undesirable outcome, the investigator repeatedly asks "Why?" to trace the chain of causality. Each answer forms the basis of the next question, drilling down through layers of symptoms until the root cause is isolated. While simple, it requires logical rigor to prevent superficial analysis. A major limitation of the 5-Whys is its linear nature, which can oversimplify complex, multi-variable failures. It assumes a single chain of events, whereas complex systems failures are often caused by the convergence of multiple, non-linear factors.'
        },
        {
          text: "**Cause-and-Effect Diagrams (Ishikawa or Fishbone Charts)**: A visual mapping tool that breaks down potential contributing causes into successive levels of detail. Causes are grouped into standardized categories: people, processes, tools, materials, measurements, and environment. This hierarchical tree helps teams brainstorm and organize potential failure drivers."
        },
        {
          text: "**Fault Tree Analysis (FTA)**: A formal, deductive technique that maps the relationship between causes and effects using logical AND/OR gates. In some failures, any single cause can trigger the outcome (OR gate); in others, a specific combination of simultaneous causes is required (AND gate). FTA is more rigorous than simple fishbone diagrams because it explicitly models this logical behavior."
        },
        {
          text: "**Failure Modes and Effects Analysis (FMEA)**: A forward-chaining technique that starts by identifying potential failure modes of individual components and traces their effects forward to analyze how they cascade into system-level failures. FMEA helps design fault-tolerant boundaries."
        },
        {
          text: "**Cause Mapping**: A highly structured map of cause-effect relationships. It chains backward to driving causes and forward to organizational impacts. Unlike fishbone charts, cause maps require empirical evidence for every cause and explicitly link the incident to organizational goals."
        },
        {
          text: "**Current Reality Tree**: A cause-effect tree bound by strict rules of logic (known as the Categories of Legitimate Reservation). It identifies the core systemic problems that drive multiple visible symptoms."
        },
        {
          text: "**Human Performance Evaluation**: This technique focuses on how human actions contribute to failures. It posits that human performance depends on four sequential phases: input detection, input understanding, action selection, and action execution. When human error is identified, investigators look for systemic drivers such as cognitive overload, cognitive underload (boredom), memory lapses, tunnel vision, complacency, or fatigue, rather than simply blaming the operator."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Root Cause-Based Process Improvement",
      type: "header"
    },
    {
      text: "RCA is most effective when integrated into a structured process improvement lifecycle. Organizations should follow a six-step methodology to translate findings into lasting process improvements:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Select the Problem to Solve**: Because engineering resources are finite, organizations must prioritize which issues to analyze. Techniques such as Pareto Analysis (applying the 80/20 rule to focus on the 20% of problems causing 80% of the defects) and frequency-severity prioritization are used to identify high-impact, undesirable outcomes."
        },
        {
          text: "**Gather Evidence**: Collect objective data surrounding the event. This includes system logs, specifications, code revisions, test reports, and witness testimony. Objective evidence prevents bias and speculation during the analysis."
        },
        {
          text: "**Identify the Root Cause**: Apply one or more RCA techniques (e.g., FTA or Cause Mapping) to trace the symptoms back to their underlying systemic causes."
        },
        {
          text: "**Select Corrective Actions**: Formulate candidate actions that prevent recurrence. Corrective actions should eliminate the cause, reduce its probability of occurrence, or disconnect the cause from the effect. The selected actions must:\n- Prevent recurrence of the undesirable outcome.\n- Fall within the organization's realistic ability to control.\n- Align with organizational goals and objectives.\n- Avoid introducing new, unforeseen problems or secondary failures.\n- Achieve the greatest amount of control for the lowest cost."
        },
        {
          text: "**Implement the Corrective Actions**: Deploy the approved changes to code, tooling, or organizational processes."
        },
        {
          text: "**Observe the Results**: Continuously monitor the system to ensure the corrective actions are efficient, effective, and have successfully prevented recurrence."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Symptom vs. Cause Distinction**: Has the investigation clearly separated the immediate, visible symptoms of the failure from the underlying systemic root causes?"
        },
        {
          text: "**Evidence-Based Documentation**: Is every cause-and-effect link documented in the analysis supported by empirical evidence (such as logs, test runs, or specifications)?"
        },
        {
          text: "**Technique Selection**: Has an appropriate RCA technique (such as 5-whys, Ishikawa diagram, FTA, or FMEA) been selected and executed based on the complexity of the incident?"
        },
        {
          text: "**AND/OR Logical Relationships**: If Fault Tree Analysis was used, did the team explicitly map and analyze logical AND and OR relationships between failure events?"
        },
        {
          text: "**Forward-Chaining FMEA Applied**: Has the system design been audited using FMEA to trace component-level failure modes forward to overall system behavior?"
        },
        {
          text: "**Human Performance Driver Analysis**: If human error was a factor, has the team analyzed systemic drivers (such as cognitive overload, fatigue, or communication gaps) instead of assigning personal blame?"
        },
        {
          text: "**Pareto Prioritization**: Was Pareto Analysis or frequency-severity prioritization used to select high-impact problems for analysis?"
        },
        {
          text: "**Corrective Action Feasibility**: Are the proposed corrective actions within the organization's scope of control and budget constraints?"
        },
        {
          text: "**Side Effect Assessment**: Have the proposed corrective actions been analyzed to ensure they do not introduce secondary risks or degrade performance in other modules?"
        },
        {
          text: "**Causality Disconnection Check**: Do the corrective actions either eliminate the root cause, reduce its probability, or completely disconnect the cause from the undesirable effect?"
        },
        {
          text: "**Evidence Gathering Completeness**: Have all relevant data sources (including configurations, build logs, standards, and code repositories) been collected and preserved?"
        },
        {
          text: "**Defect Causal Integration**: Has the defect causal analysis resulted in specific updates to test suites, linter configurations, or compilation rules?"
        },
        {
          text: "**Risk Assessment Update**: Have the risk logs and threat models of the system been updated to reflect the new failure vectors discovered during the analysis?"
        },
        {
          text: "**Post-Implementation Observation**: Is there a documented plan and schedule to observe and measure the effectiveness of the corrective actions after implementation?"
        },
        {
          text: "**Stakeholder Collaboration**: Were representative stakeholders from development, quality assurance, operations, and business units involved in the root cause discovery process?"
        },
        {
          text: "**Logical Validity Check**: Has the causality model (e.g., Cause Map or Current Reality Tree) been audited against the rules of logic to ensure there are no unproven assumptions or logical leaps?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "engineering foundations, root cause analysis, RCA, change analysis, 5 whys, Ishikawa diagram, fault tree analysis, FMEA, cause mapping, human performance, process improvement",
  filename: "engineering-foundations-root-cause-analysis",
  trigger: "model_decision"
});
