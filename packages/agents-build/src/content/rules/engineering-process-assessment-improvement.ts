import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringProcessAssessmentImprovement = defineRule({
  content: [
    {
      level: 1,
      text: "Software Process Assessment and Improvement",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      level: 3,
      text: "1.1 Overview of Software Process Assessment and Improvement",
      type: "header"
    },
    {
      text: "Software process assessment and improvement (SPAI) is a core sub-discipline of software engineering, as detailed in Chapter 10, Section 3 of the IEEE Software Engineering Body of Knowledge (SWEBOK v4). The central thesis of SPAI is that the quality of a software product is directly linked to the quality of the processes used to build it. Rather than treating development as an ad-hoc activity, SPAI frames it as an engineering discipline that is repeatable, observable, and continuously optimizable. ",
      type: "text"
    },
    {
      text: "Process assessment is the systematic evaluation of an organization's software processes against a reference model or standard to identify process strengths, weaknesses, and optimization opportunities. Process improvement is the subsequent implementation of planned changes to address weaknesses, enhance execution efficiency, and align process outcomes with organizational goals. ",
      type: "text"
    },
    {
      text: "A prerequisite for assessment is process definition. Processes must be documented using standardized notations (such as natural language, text lists, data-flow diagrams, state charts, IDEF0, Petri nets, UML activity diagrams, or BPMN). These notations provide a common language for stakeholders and serve as the baseline for measurement. By establishing formal assessment and improvement cycles, organizations transition from chaotic, reactive development environments to structured, predictable, and managed engineering ecosystems.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Deming's PDCA Paradigm and Empirical Decision Making",
      type: "header"
    },
    {
      text: "The conceptual foundations of continuous process improvement are historically rooted in the classic Shewhart-Deming Plan-Do-Check-Act (PDCA) cycle, an iterative management method for the control and continuous improvement of engineering processes. In software engineering, the four phases are defined as:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Plan**: Establish objectives, identify target processes, define key performance indicators, design process changes, and establish baseline metrics."
        },
        {
          text: "**Do**: Execute the planned processes and collect quantitative performance data and qualitative feedback from the development environment."
        },
        {
          text: "**Check**: Analyze the gathered data, compare actual project outcomes against planned objectives, evaluate deviations, and perform root-cause analysis on process failures or bottlenecks."
        },
        {
          text: "**Act**: Standardize successful process modifications, implement corrective actions for unresolved issues, update the organizational standard process library, and feed lessons learned back into the planning phase of the next cycle."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Within software engineering process management, the PDCA cycle is critical for establishing empirical decision-making. Engineering decisions—such as selecting a software development lifecycle model, integrating validation tools, or adopting architectural patterns—must not be based on developer convenience or speculative assumptions. Instead, they must be driven by empirical evidence gathered through systematic measurement during the Check phase, which minimizes uncertainty and enhances predictability.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Basili's Quality Improvement Paradigm and Goal-Question-Metric (GQM)",
      type: "header"
    },
    {
      text: "To adapt general quality improvement principles to the cognitive-heavy nature of software construction, Victor Basili developed the Quality Improvement Paradigm (QIP) and the Goal-Question-Metric (GQM) approach. QIP is a six-step experimental framework that guides software organizations through a continuous cycle of learning, improvement, and experience packaging:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Characterize**: Understand and document the current project environment to establish a realistic baseline."
        },
        {
          text: "**Set Goals**: Define clear, measurable goals for project success and process performance."
        },
        {
          text: "**Choose Process**: Select appropriate software engineering processes, methods, and tools based on goals."
        },
        {
          text: "**Execute**: Implement the chosen processes, construct software work products, and collect project data."
        },
        {
          text: "**Analyze**: Evaluate collected data to analyze current practices and assess the impact of process changes."
        },
        {
          text: "**Package**: Document lessons learned, update process models, and store historical data in an experience factory for future projects."
        }
      ],
      type: "numberedList"
    },
    {
      text: "The GQM approach serves as the measurement mechanism within QIP. GQM operates on the principle that software measurement must be goal-oriented; collecting metrics without a clear engineering purpose leads to data bloat and analysis paralysis. GQM structures measurement into three levels:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Conceptual Level (Goal)**: Define a measurement goal specifying the object of study, purpose, quality focus, viewpoint, and context (e.g., analyzing peer reviews to reduce defect leakage from the viewpoint of the team lead)."
        },
        {
          text: "**Operational Level (Question)**: Formulate questions to assess whether the goals are being met (e.g., checking what percentage of code defects are caught during peer review rather than system testing)."
        },
        {
          text: "**Quantitative Level (Metric)**: Associate quantitative metrics with each question to gather the empirical data necessary to answer them (e.g., lines of code reviewed per hour, defect counts categorized by phase of origin, review preparation time)."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "By tracing metrics back to questions and questions back to goals, GQM ensures that every measured value directly supports engineering decision-making.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Framework-Based Assessment Methods (CMMI, ISO/IEC 33000 SPICE)",
      type: "header"
    },
    {
      text: "While GQM provides a bottom-up, goal-driven approach, framework-based methods offer top-down, standardized reference models for process assessment. The two most prominent frameworks are Capability Maturity Model Integration (CMMI) and the ISO/IEC 33000 series, which evolved from the SPICE (Software Process Improvement and Capability Determination) project.",
      type: "text"
    },
    {
      items: [
        {
          text: "**CMMI**: Developed by the Software Engineering Institute (SEI), CMMI provides a structured framework for improving organizational capability. It offers continuous (evaluating individual process areas along capability levels) and staged representations (assessing the overall organization across five maturity levels: Initial, Managed, Defined, Quantitatively Managed, and Optimizing)."
        },
        {
          text: "**ISO/IEC 33000**: This international standard establishes a process reference model (PRM) defining processes in terms of purpose and outcomes, and a process assessment model (PAM) defining a measurement framework for process capability. The capability scale ranges from Level 0 (Incomplete process) to Level 5 (Optimizing process). The standard provides a framework for assessing process capability and organizational maturity, covering systems development, maintenance, and service delivery."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "These frameworks provide a common language and benchmark for organizations to evaluate their engineering maturity, identify capability gaps, satisfy contractual or regulatory compliance, and establish roadmap plans for long-term improvement.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Process Assessment and Improvement in Agile Methodologies (Retrospectives)",
      type: "header"
    },
    {
      text: "Agile software development methodologies shift the focus of process assessment and improvement from formal, infrequent audits to continuous, team-driven feedback loops. The primary mechanism for process improvement in Agile is the retrospective, executed at the end of each iteration or sprint. ",
      type: "text"
    },
    {
      text: "The retrospective is a collaborative meeting where the team reflects on the iteration that just concluded. The team analyzes what went well, what did not go well, and why, focusing on processes, interactions, tools, and relationships. The goal of a retrospective is to identify a small, manageable set of actionable improvement items that the team commits to implementing in the very next iteration. This practice embeds process improvement directly into the development cycle, creating a culture of continuous learning, rapid experimentation, and adaptive self-organization.",
      type: "text"
    },
    {
      level: 3,
      text: "1.6 Postmortem Reviews and Organizational Learning",
      type: "header"
    },
    {
      text: "In addition to Agile retrospectives, organizations employ postmortem reviews (post-project reviews) at the completion of a major project, release milestone, or significant operational incident. A postmortem review is a formal, retrospective analysis designed to capture and document the collective experience of the project team. ",
      type: "text"
    },
    {
      text: "The process involves gathering quantitative data (e.g., schedule adherence, effort deviation, defect density) and qualitative feedback (e.g., team dynamics, tool limitations, requirement changes). The objective is to identify systemic issues, understand the root causes of major failures, and package this knowledge into lessons learned. By formalizing postmortem reviews, organizations prevent the loss of tacit knowledge, facilitate organizational learning, and continuously update their process assets, standards, and training programs.",
      type: "text"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "Are all software engineering processes formally defined and documented using standardized notations such as BPMN, UML activity diagrams, state charts, or text-based activity lists?"
        },
        {
          text: "Is the Deming PDCA (Plan-Do-Check-Act) cycle integrated into the lifecycle to ensure continuous, iterative process improvement?"
        },
        {
          text: "Are all process assessment and improvement decisions driven by empirical evidence and quantitative measurements rather than subjective opinions?"
        },
        {
          text: "Is the Goal-Question-Metric (GQM) approach used to design a goal-oriented measurement program, preventing the collection of unused metrics?"
        },
        {
          text: "Do all measurement goals specify the target object of study, purpose, quality focus, stakeholder viewpoint, and context to ensure analytical relevance?"
        },
        {
          text: "Are quantitative metrics traced back to operational questions and conceptual goals to ensure that data collection supports decision-making?"
        },
        {
          text: "Is Basili's Quality Improvement Paradigm (QIP) followed to characterize the environment, execute processes, analyze data, and package experience?"
        },
        {
          text: "Are process capability and organizational maturity regularly assessed against standard reference frameworks such as CMMI or ISO/IEC 33000 (SPICE)?"
        },
        {
          text: "Does the process reference model (PRM) define processes in terms of process purpose and expected outcomes?"
        },
        {
          text: "Does the process assessment model (PAM) establish a measurement framework to evaluate process capability levels?"
        },
        {
          text: "Are Agile retrospectives conducted at the end of each development iteration to analyze what went well, what did not go well, and why?"
        },
        {
          text: "Does the retrospective meeting result in concrete, actionable process improvement tasks prioritized for the immediate next iteration?"
        },
        {
          text: "Are formal postmortem reviews executed upon project completion or critical incidents to capture lessons learned?"
        },
        {
          text: "Do postmortem reviews combine quantitative performance data with qualitative feedback to identify systemic issues?"
        },
        {
          text: "Is there a formal mechanism to package and store lessons learned, process assets, and historical data to support future project planning?"
        },
        {
          text: "Are all engineering tools integrated with defined processes to ensure process execution data is recorded automatically?"
        },
        {
          text: "Is the process improvement plan reviewed and updated periodically to ensure alignment with business goals and technology stack updates?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software process assessment and improvement, Deming PDCA, Goal-Question-Metric GQM, framework-based methods, CMMI, SPICE ISO 33000, Agile retrospectives, postmortem reviews",
  filename: "engineering-process-assessment-improvement",
  trigger: "model_decision"
});
