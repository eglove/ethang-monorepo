import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const qualityManagementProcess = defineRule({
  content: [
    {
      level: 1,
      text: "Software Quality Management Process: QMS, Improvement, and Measurement",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software Quality Management (SQM) is defined by the IEEE Software Engineering Body of Knowledge (SWEBOK v4) as the coordinated set of activities to direct and control an organization with regard to software quality. SQM establishes the organizational processes, policies, responsibilities, and measurement frameworks required to ensure that software products and services satisfy project objectives, comply with regulatory standards, and achieve customer satisfaction. Rather than managing quality on a reactive, project-by-project basis, SQM establishes a systematic, repeatable capability across the entire organization.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Quality Management Systems (QMS)",
      type: "header"
    },
    {
      text: "A cornerstone of SQM is the design, implementation, and maintenance of a Quality Management system (QMS). A QMS provides the organizational structure, policies, processes, procedures, and resources necessary to manage and improve software quality. ISO/IEC/IEEE 90003 provides specific guidance for applying the general quality concepts of ISO 9001 to the software development lifecycle, maintenance, and operations.\nA robust QMS defines:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Process Boundaries and Owners**: Clearly identifies who is responsible for each engineering process and the boundary conditions for process execution."
        },
        {
          text: "**Process Requirements**: Defines the inputs, entry criteria, task procedures, and exit criteria for each process."
        },
        {
          text: "**Measurements**: Establishes metrics to assess process execution quality and output characteristics."
        },
        {
          text: "**Feedback Channels**: Comprises mechanisms to communicate quality findings, process capabilities, and defect reports across the organization.\nTo be effective, a QMS requires strong management sponsorship, adequate resource allocation, and a mandate that quality authorities operate independently of project management teams to avoid scheduling and budget pressures."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Software Quality Improvement (SQI)",
      type: "header"
    },
    {
      text: "Software Quality Improvement (SQI) focuses on enhancing process effectiveness, efficiency, and predictability. Based on the engineering principle that product quality is directly linked to process quality, SQI utilizes several methodologies:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Process Improvement Frameworks**: Software Process Improvement (SPI) models analyze and optimize engineering workflows. The Plan-Do-Check-Act (PDCA) cycle, Kaizen, and Quality Function Deployment (QFD) help organizations define quality goals, implement modifications, and measure progress."
        },
        {
          text: "**Six Sigma**: A data-driven methodology that aims to reduce process variation and eliminate defects. It follows the DMAIC (Define, Measure, Analyze, Improve, Control) framework. Define establishes project goals; Measure gathers baseline process performance data; Analyze identifies the root causes of variation and defects; Improve optimizes the process using statistical techniques; Control monitors the process to sustain improvements."
        },
        {
          text: "**Lean Principles**: Focuses on maximizing customer value while minimizing waste. Lean identifies seven wastes in software development: partially done work, extra features, relearning, handoffs, delays, task switching, and defects. Eliminating these wastes reduces lead time and defects."
        },
        {
          text: "**Individual Improvement**: Watts Humphrey's Personal Software Process (PSP) provides a structured framework for individual engineers to record their own defects, measure task durations, plan workloads, and continuously improve their personal skills and estimation accuracy. PSP progresses from PSP0 (basic measurement) to PSP2.1 (detailed design templates and verification)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Plan Quality Management",
      type: "header"
    },
    {
      text: "Quality planning determines which standards, models, and procedures apply to a project, establishes quantitative quality goals, estimates the effort needed to achieve them, and identifies the milestones at which quality activities must occur.\nEffective quality planning requires:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Organizational Quality Policies**: Standardized, approved policies that guide developer behavior and project decisions."
        },
        {
          text: "**Graphical Process Descriptions**: Visually represented processes and workflows that clarify roles, inputs, activities, and expected outputs."
        },
        {
          text: "**Independent SQA Budgeting**: Ensuring SQA and verification activities are planned and funded as distinct, independent budget items, protected from project development pressures."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Evaluate Quality Management and Process Capability",
      type: "header"
    },
    {
      text: "Once a QMS is operational, its capabilities and maturity must be evaluated. The ISO/IEC Technical Specification TS 33061:2021 defines a process capability model for assessing software lifecycle processes. It evaluates processes across five distinct capability levels:",
      type: "text"
    },
    {
      items: [
        {
          text: "*Level 0 (Incomplete)*: The process is not implemented or fails to achieve its process purpose."
        },
        {
          text: "*Level 1 (Performed)*: The process achieves its process purpose."
        },
        {
          text: "*Level 2 (Managed)*: The process is planned, monitored, and adjusted, and its work products are established, controlled, and maintained."
        },
        {
          text: "*Level 3 (Established)*: A defined process is implemented based on a standardized organizational process."
        },
        {
          text: "*Level 4 (Predictable)*: The process operates quantitatively within defined limits to achieve its outcomes."
        },
        {
          text: "*Level 5 (Optimizing)*: The process is continuously improved to meet current and projected business goals.\nIEEE 730:2014 provides complementary guidance for evaluating SQA activities and QMS maturity. These evaluations identify gaps and drive targeted organizational improvement programs."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.5 Software Quality Measurement and Analytics",
      type: "header"
    },
    {
      text: "SQM relies on quantitative measures to support decision-making, evaluate process efficiency, and determine when software is ready for release. Three primary measures include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Error Density**: The number of human errors discovered per unit size of documentation or software (e.g., errors per requirements page)."
        },
        {
          text: "**Defect Density**: The number of defects found divided by the size of the software (e.g., defects per thousand lines of code)."
        },
        {
          text: "**Failure Rate**: The frequency of software failures during a specified period (e.g., Mean Time to Failure).\nMathematical and graphical techniques are used to analyze this data:"
        },
        {
          text: "*Descriptive Statistics*: Pareto analysis (identifying the 80/20 rule of defect distribution), run charts, scatter plots, and normal distributions."
        },
        {
          text: "*Statistical Tests*: Binomial and chi-squared tests to validate hypotheses about quality improvements."
        },
        {
          text: "*Trend Analysis*: Control charts to determine if a process is operating within stable statistical limits."
        },
        {
          text: "*Predictive Reliability Models*: Mathematical models built from failure data to forecast future failure probabilities and determine optimal testing completion criteria."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Corrective and Preventive Actions",
      type: "header"
    },
    {
      text: "When quality goals are not met or nonconformities are discovered, corrective actions must be documented, tracked, and implemented to prevent recurrence. This requires a formalized defect characterization taxonomy to classify and analyze anomalies. Software quality control (SQC) techniques help identify the types of defects occurring most frequently, allowing engineers to perform Root Cause Analysis (RCA). RCA analyzes defect data to trace anomalies back to their underlying process, tooling, or training deficiencies, driving updates to the QMS and preventing recurrence in future projects.",
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
          text: "Has a Quality Management system (QMS) been designed, documented, and maintained for the organization?"
        },
        {
          text: "Are process boundaries, inputs, entry criteria, task procedures, exit criteria, and process owners clearly defined in the QMS?"
        },
        {
          text: "Is the quality management function organizationally independent of the project development and management teams?"
        },
        {
          text: "Does the QMS incorporate feedback channels to communicate process capabilities and quality metrics back to the development teams?"
        },
        {
          text: "Are quality objectives, standards, and models specified in the project's quality plan?"
        },
        {
          text: "Has the effort, schedule, and cost associated with achieving quality targets been estimated and documented?"
        },
        {
          text: "Are Software Process Improvement (SPI) initiatives planned and tracked independently across projects?"
        },
        {
          text: "Does the organization promote individual self-assessment and process improvement practices, such as the Personal Software Process (PSP)?"
        },
        {
          text: "Are QMS capability levels evaluated and tracked systematically in accordance with ISO/IEC TS 33061?"
        },
        {
          text: "Has a software quality measurement plan been established to collect quantitative metrics on process and product quality?"
        },
        {
          text: "Are key quality metrics—including error density, defect density, and failure rate—regularly computed and analyzed?"
        },
        {
          text: "Do stakeholders utilize mathematical and graphical techniques (such as Pareto analysis, control charts, or scatter plots) to interpret metrics?"
        },
        {
          text: "Are predictive reliability models used to analyze failure data and support release readiness decisions?"
        },
        {
          text: "Is there a formalized, documented defect taxonomy used to categorize anomalies across requirements, design, code, and tests?"
        },
        {
          text: "Are corrective and preventive actions documented, tracked, and reviewed to resolve process and tool deficiencies?"
        },
        {
          text: "Is Root Cause Analysis (RCA) systematically conducted on major defects to identify and resolve systemic QMS issues?"
        },
        {
          text: "Are measurements from SQC activities recorded in a central repository to build historical defect profiles and benchmarks?"
        },
        {
          text: "Does management sponsorship actively review quality metrics and sponsor improvement projects to resolve nonconformities?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software quality management process, quality management system, QMS, software quality improvement, SQI, software process improvement, SPI, plan quality management, QMS policies, evaluate quality management, process capability levels, software quality measurement, error density, defect density, failure rate, corrective and preventive actions, defect characterization, root cause analysis, SQC",
  filename: "quality-management-process",
  trigger: "model_decision"
});
