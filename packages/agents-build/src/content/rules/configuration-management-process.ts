import { defineRule } from "../../define.ts";

export const configurationManagementProcess = defineRule({
  content: `# Configuration Management Process

## 1. Domain Theory and Conceptual Foundations
Software Configuration Management (SCM) is a critical software engineering discipline concerned with controlling the evolution and integrity of software systems. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 8, SCM facilitates development and change implementation activities by identifying configuration items (CIs), managing and controlling change, and verifying, recording, and reporting configuration information. The SCM process must be carefully planned and managed, requiring a thorough understanding of the organizational context, constraints, and relationships among organizational elements. SCM planning results in a Software Configuration Management Plan (SCMP), which serves as a living document throughout the software lifecycle.

### 1.1 Organizational Context for SCM
To design an SCM process, engineers must understand how SCM interacts with other parts of the organization. SCM interacts with system engineering, software development, software maintenance, and quality assurance (QA). SCM responsibility often rests with a distinct organizational unit or a designated individual, though certain tasks may be delegated. 

When software is part of a larger system with hardware and firmware elements, SCM activities must run in parallel and remain consistent with system-level CM. Firmware contains both hardware and software, meaning both hardware and software CM concepts apply. SCM also interfaces with the organization's QA activities on issues like records management and nonconforming items. While QA manages nonconforming items, SCM assists by tracking and reporting on software configuration items (SCIs) in this category. The closest relationship is with development and maintenance, where configuration control tasks occur.

Constraints and guidance for the SCM process come from corporate policies, project contracts (which may mandate specific audits or require certain items to be under CM), and external regulatory bodies (especially when public safety is involved). The chosen software life cycle process (SLCP) and its level of formalism also affect SCM design. Software engineers find additional guidance in best practices from international standards organizations.

### 1.2 SCM Process Planning and the SCMP
SCM process planning for a project must be consistent with the organizational context, constraints, commonly accepted guidance, and project characteristics (such as size, safety criticality, and security). SCM planning covers software configuration identification, configuration control, status accounting, configuration auditing, and release management and delivery. It also addresses organization, responsibilities, resources, schedules, tool selection, vendor control, and interface control. 

The planning results are recorded in the Software Configuration Management Plan (SCMP). The SCMP is a living document, updated and approved during the software life cycle. Implementing the SCMP requires developing detailed subordinate procedures defining how specific requirements are met in day-to-day activities, such as branching strategies, build frequency, and automated test execution. The SCMP is subject to SQA review and audit.

### 1.3 Branching and Merging Strategies
Branching and merging strategies must be carefully planned and communicated because they affect all SCM activities. A branch is defined as a set of evolving source file versions, and merging consists of combining different changes to the same file. Merging typically occurs when more than one developer changes a CI. The chosen branching and merging strategy must align with the software development lifecycle model. For example, continuous integration (CI) is characterized by frequent build-test-deploy cycles, meaning SCM activities must be planned accordingly to support automated verification, merge conflict resolution, and rapid feedback loops.

### 1.4 SCM Organization and Responsibilities
To prevent confusion about who performs specific SCM tasks, organizational roles must be clearly identified and assigned to specific entities or individuals. Responsibilities should be documented by title or by designating the organizational division. The overall authority and reporting channels for SCM must be identified, which is often coordinated at the project management or QA planning stages. Clear division of duties between development, configuration management, and release engineering ensures objectivity in audits and prevents unauthorized baseline changes.

### 1.5 SCM Resources and Schedules
SCM planning identifies the staff and tools required to carry out SCM activities. It also establishes the sequences of SCM tasks, placing each task within the project schedule relative to milestones (e.g., establishing a baseline before a code freeze). SCM plans must specify training requirements for implementing the plan and onboarding new staff members to guarantee that configuration management processes are followed consistently.

### 1.6 Tool Selection and Implementation
Selecting and implementing SCM tools requires careful planning. SCM is rarely supported by a single tool; instead, it relies on a set of tools (a workbench) that may be open (comprising tools from different suppliers) or integrated (designed to work together). Key questions to consider during tool selection include:
- Organization: What is the organizational motivation for tool acquisition?
- Tools: Can commercial-off-the-shelf (COTS) tools be used, or must custom tools be developed?
- Environment: What constraints are imposed by the organizational and technical context?
- Legacy: How will existing projects migrate to or use the new tools?
- Financing: Who will fund acquisition, maintenance, customization, and training?
- Scope: How widely will the tools be deployed (e.g., organization-wide or project-specific)?
- Ownership: Who is responsible for introducing and maintaining the tools?
- Future: What is the long-term plan for tool usage?
- Change: How adaptable are the tools to evolving processes?
- Branching and merging: Do the tools support the planned branching and merging strategies?
- Integration: How well do the SCM tools integrate with each other and other development tools?
- Migration: Can the repository and its full history of configuration items be ported to other tools?

Tool selection must balance process enforcement with developer flexibility, as some tools strictly enforce a predefined workflow while others allow engineers to adapt procedures.

### 1.7 Vendor and Subcontractor Control
Software projects often acquire third-party software products (like compilers, libraries, or tools). SCM planning must determine how these items are managed under configuration control (e.g., integration into project libraries) and how updates are evaluated and integrated. For subcontracted software, SCM planning must establish the SCM requirements to be imposed on the subcontractor, the mechanisms for monitoring compliance, and the SCM information that must be shared.

### 1.8 Interface Control
Interface control is necessary when a software item interfaces with hardware, firmware, or other software items. Because changes to one side of an interface can impact the other, SCM planning must define how interfacing items are identified and how changes are managed and communicated. This activity often occurs within a larger system-level interface control process involving interface specifications, interface control plans, and interface control documents.

### 1.9 SCM Surveillance, Measures, and In-Process Audits
After the SCM process is implemented, surveillance ensures that SCMP provisions are carried out correctly. SQA audits and reviews verify compliance with specified SCM processes and procedures. SCM tools with process control capabilities can facilitate surveillance by automating compliance and reporting.

SCM measures and measurement provide ongoing insight into the state of the product and the SCM process. Software libraries and SCM tools enable the extraction of data such as change implementation times, defect densities, and change volume. Analyzing these measurements helps evaluate process effectiveness, optimize authority levels for approving changes, estimate future resource requirements, and identify process improvement opportunities. However, surveillance must focus on the qualitative insights gained rather than the quantitative metrics themselves.

In-process audits of SCM are formal mechanisms to assess the implementation of the SCM process and the status of specific configuration elements. Typically coordinated with the SQA function, these audits verify that the actual workspace state aligns with the documented configuration baseline, ensuring configuration integrity before major milestones or releases.

## 2. Compliance Checklist
- [ ] Is the SCM process planned and documented in a formal Software Configuration Management Plan (SCMP) that has undergone SQA review?
- [ ] Does the SCM planning align with the organizational context, including system-level configuration management for hardware or firmware components?
- [ ] Are the constraints on SCM from corporate policies, acquisition contracts, and public safety regulations explicitly documented?
- [ ] Has a branching and merging strategy been defined, documented, and communicated to all members of the development team?
- [ ] Does the SCM plan accommodate the specific requirements of the chosen software development life cycle, such as continuous integration cycles?
- [ ] Are SCM organizational roles, responsibilities, reporting channels, and authority levels clearly defined and assigned to specific titles or divisions?
- [ ] Are SCM staff, tools, and physical resources identified and scheduled to match project milestones?
- [ ] Have SCM training requirements been specified for existing staff and onboarding new team members?
- [ ] Was a formal tool evaluation conducted, addressing organization, environment, legacy systems, financing, and branching strategy compatibility?
- [ ] Do the selected SCM tools support the maintenance of complete configuration item history during potential future migrations?
- [ ] Is the SCM workbench defined as open or integrated, and are tool integration points with the development environment documented?
- [ ] Are third-party software products and tools identified, controlled, and managed under the project's configuration control procedures?
- [ ] Are SCM requirements and compliance monitoring mechanisms formally established for all subcontracted software components?
- [ ] Are hardware, firmware, and software interfaces identified, with changes managed through interface control documents?
- [ ] Is regular SCM surveillance planned and conducted to ensure compliance with the SCMP and related SQA requirements?
- [ ] Do SCM measures capture process performance data (e.g., change turnaround time) to identify process improvement opportunities?
- [ ] Are in-process SCM audits conducted periodically to verify the status of specific configuration elements and compliance with SCM procedures?
- [ ] Are detailed, subordinate procedures developed to define day-to-day SCM tasks, such as build frequency and automated testing schedules?
- [ ] Is the SCMP maintained as a living document, updated and approved as necessary during the software life cycle?`,
  description:
    "SCM process management including planning, tool selection, interface control, and monitoring",
  filename: "configuration-management-process",
  trigger: "model_decision"
});
