import { defineRule } from "../../define.ts";

export const engineeringFoundationsEmpiricalMethods = defineRule({
  content: `# Engineering Foundations - Empirical Methods

## 1. Domain Theory and Conceptual Foundations
Empirical methods and experimental techniques are fundamental to the discipline of software engineering, serving as the primary means of validating theories, evaluating design alternatives, and understanding real-world processes. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 18, Section 4, the engineering process is inherently iterative and heavily reliant on empirical verification. Software engineering deals with complex, human-centric, and highly variable phenomena where purely analytical or deductive mathematical models are often insufficient or incomplete. Empirical studies allow software engineers to observe, model, and analyze these phenomena under controlled or natural conditions to describe variability in observations, identify the sources of that variability, and make rational, evidence-based engineering decisions.

### 1.1 The Role of Variability and Observation in Software Engineering
Every engineering discipline must contend with variability. In physical engineering, variability arises from material properties, manufacturing tolerances, and environmental conditions. In software engineering, variability is primarily driven by human factors, such as developer experience, task complexity, tool support, and changing requirements. Empirical methods provide the statistical and structural tools necessary to isolate the signal (the effect of a new tool, process, or design) from the noise (inherent human and environmental variability). Without empirical methods, software engineering decisions revert to ad-hoc preferences, intuition, or unverified industry trends, violating the core engineering requirement of a systematic, disciplined, and quantifiable approach.

### 1.2 Conceptual Framework of Empirical Studies
To conduct scientific and engineering investigations, developers must understand the foundational vocabulary and components of empirical studies:
- **Independent Variables**: The factors or conditions that the investigator manipulates, controls, or selects to observe their effect. In software engineering, independent variables are often tools (e.g., using a compiler versus not), processes (e.g., test-driven development versus test-last development), or experience levels.
- **Dependent Variables**: The outcomes or response variables that are measured to evaluate the effect of the independent variables. Examples include defect density, development time, code maintainability metrics, or user error rates.
- **Hypothesis Formulation**: A precondition for any empirical investigation is the formulation of a clear, testable, and falsifiable hypothesis. The null hypothesis (H0) generally states that the independent variable has no effect on the dependent variable (e.g., there is no difference in defect density between the two development methods). The alternative hypothesis (H1) states that there is a significant difference or effect.
- **Treatments**: A treatment refers to a specific combination of levels of the independent variables applied to the experimental units. The simplest empirical design involves two treatments: a treatment group (e.g., using a new static analysis tool) and a control group (e.g., not using the tool, representing the baseline).
- **Experimental Units**: The entities to which the treatments are applied and on which measurements are taken. These can be individual developers, software modules, project teams, or testing sessions.

### 1.3 Designed Experiments (Controlled Experiments)
A designed or controlled experiment is the most rigorous empirical method, characterized by the deliberate manipulation of one or more independent variables under controlled conditions to measure their effect on one or more dependent variables. Designed experiments are specifically structured to establish cause-and-effect relationships.
- **Prerequisites**: Conducting a designed experiment requires a well-formulated hypothesis, access to a suitable pool of experimental units, and the ability to control or randomize external variables that could confound the results.
- **Randomization**: Random assignment of experimental units to treatments is critical. It ensures that confounding factors (such as developer skill or module complexity) are distributed evenly across treatment groups, preventing systematic bias.
- **Experimental Designs**: Designs range from simple single-factor, two-level experiments (e.g., comparing productivity with and without a specific IDE plugin) to complex factorial designs that investigate multiple independent variables and their interactions simultaneously.

### 1.4 Observational Studies (Case Studies)
An observational study, often referred to as a case study, is an empirical inquiry that investigates a contemporary phenomenon within its real-world context. While controlled experiments deliberately isolate the phenomenon from its context to study specific variables, case studies embrace and analyze the context.
- **Applicability**: Case studies are highly valuable when focusing on "how" and "why" questions, when the behavior of the subjects cannot be manipulated or controlled, and when the boundaries between the phenomenon and its context are not clearly defined.
- **Data Collection**: Case studies typically rely on multiple sources of evidence, including interviews, direct observations, document analysis, and system metrics. This triangulation of data sources increases the reliability and depth of the findings.
- **Limitations**: Because case studies lack controlled manipulation and random assignment, establishing direct cause-and-effect relationships is challenging. However, they provide high ecological validity, showing how tools and processes perform in real software development organizations.

### 1.5 Retrospective Studies (Historical Studies)
A retrospective study involves the analysis of historical data that has been collected and archived over time. Instead of executing new processes, the engineer acts as an investigator of historical project records.
- **Purpose**: Retrospective studies are used to identify long-term trends, find relationships between historical variables, or build predictive models (e.g., using past defect rates to predict which modules in a new release will contain the most bugs).
- **Data Sources**: Sources include version control commit logs, issue tracking databases, continuous integration build histories, and project archives.
- **Limitations and Risks**: The primary limitation is the quality of the archived data. Historical records are frequently incomplete, inconsistently measured across different teams, or contain incorrect classifications (e.g., a bug fix classified as a feature addition). The engineer must carefully clean and validate the historical dataset before conducting statistical analyses.

### 1.6 Threats to Validity in Empirical Software Engineering
Evaluating the quality of an empirical study requires analyzing four categories of threats to validity:
- **Internal Validity**: The degree of confidence that the observed relationship between the independent and dependent variables is causal and not the result of some uncontrolled confounding factor (e.g., the treatment group having more experienced developers than the control group).
- **External Validity**: The extent to which the findings of the study can be generalized to other settings, project scales, development cultures, or time periods. For instance, an experiment conducted with software engineering students may have limited external validity when generalized to senior developers in industry.
- **Construct Validity**: The degree to which the operational measures used in the study correctly represent the theoretical concepts they are intended to measure. For example, using lines of code as a construct for programmer productivity or cyclomatic complexity as a construct for software maintainability has high threats to construct validity.
- **Conclusion Validity**: The reliability of the statistical conclusions drawn from the data. This includes ensuring that appropriate statistical tests are used, that their underlying assumptions are met, and that the study has sufficient statistical power to detect real effects.

## 2. Empirical Methods Compliance Checklist
This checklist defines SWEBOK-derived criteria for planning, executing, and evaluating empirical studies in software engineering:

- [ ] **Empirical Design Selection**: Is the selected empirical method (designed experiment, observational study, or retrospective study) aligned with the research questions and level of control possible?
- [ ] **Falsifiable Hypotheses**: Are the null (H0) and alternative (H1) hypotheses clearly stated, falsifiable, and defined before any data collection begins?
- [ ] **Variable Delineation**: Are all independent variables (factors manipulated) and dependent variables (outcomes measured) clearly identified and operationalized?
- [ ] **Treatment Specification**: Are the treatments, including the baseline control condition (e.g., standard process vs. new process), clearly specified?
- [ ] **Experimental Control**: Are confounding variables identified, and are tactics (such as randomization, blocking, or statistical control) applied to mitigate their effects?
- [ ] **Subject Representativeness**: Is the selection of participants or software units documented, and are the limitations of using the sample analyzed?
- [ ] **Observational Study Context**: For case studies, is the real-world organizational and technical context of the study documented in detail?
- [ ] **Triangulation of Evidence**: In observational designs, are multiple data sources (metrics, interviews, logs) used to triangulate and validate findings?
- [ ] **Retrospective Data Auditing**: For retrospective studies, is the historical dataset audited for completeness, inconsistency, and classification errors?
- [ ] **Internal Validity Mitigation**: Are threats to internal validity (e.g., maturation, selection bias, instrumentation changes) identified and addressed?
- [ ] **External Validity Limitations**: Are the boundaries of generalization (external validity) explicitly defined for the study's findings?
- [ ] **Construct Validity Check**: Are the chosen metrics validated to ensure they accurately measure the theoretical constructs of interest?
- [ ] **Statistical Power Analysis**: Is the statistical power evaluated to ensure the sample size is sufficient to detect meaningful effects?
- [ ] **Replicability Documentation**: Are the study protocols, data collection steps, and raw data schemas documented to allow independent replication?
- [ ] **Ethics and Privacy**: Are the rights, privacy, and informed consent of human subjects protected and documented throughout the study?
- [ ] **Pilot Study Execution**: Is a pilot run of the empirical protocol conducted to test measurement tools and clear up procedural ambiguities?
- [ ] **Reporting Objectivity**: Are all results reported objectively, including negative findings, non-significant results, and unexpected anomalies?`,
  description:
    "empirical methods, experimental techniques, designed experiment, observational study, retrospective study, independent variables, dependent variables, hypothesis formulation, threats to validity, software engineering decisions",
  filename: "engineering-foundations-empirical-methods",
  trigger: "model_decision"
});
