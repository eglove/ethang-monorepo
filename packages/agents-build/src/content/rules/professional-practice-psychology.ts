import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const professionalPracticePsychology = defineRule({
  content: [
    {
      level: 1,
      text: "Group Dynamics and Psychology: Teamwork, Cognition, Stakeholders, and Diversity",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering is inherently a collaborative activity, typically performed by teams. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4), a software engineer must interact cooperatively and constructively with others to solve complex problems and meet stakeholder expectations. Success requires an understanding of group dynamics, individual cognitive limitations, stakeholder management, uncertainty mitigation, conflict resolution, and diversity practices.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Dynamics of Working in Teams and Groups",
      type: "header"
    },
    {
      text: "High-performing software engineering teams demonstrate consistent quality of work and steady progress toward goals. Cohesive teams are characterized by a cooperative, honest, and focused atmosphere where individual and team goals are closely aligned.\nKey dynamics that foster team cohesion include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Alignment of Goals**: Ensuring individual professional objectives align with the team's shared goals, creating a natural sense of commitment and ownership of outcomes. When goals are misaligned, friction occurs, and productivity drops."
        },
        {
          text: "**Intellectual Honesty**: Team members must practice intellectual honesty by admitting ignorance when they lack information, acknowledging mistakes without fear of blame, and avoiding groupthink. Acknowledging mistakes early prevents the accumulation of technical debt and hidden defects."
        },
        {
          text: "**Fair Workload and Rewards**: Responsibility, workload, and recognition must be shared fairly among team members. A cohesive team shares both the successes and the failures, reinforcing a collaborative spirit."
        },
        {
          text: "**Constructive Peer Reviews**: Reviews of work products (e.g., code reviews, design audits) must be framed in a constructive, non-personal manner. The focus must remain on the work product's quality, allowing developers to improve continuously without personal risk or fear of embarrassment. This fosters psychological safety."
        },
        {
          text: "**Leadership and Conflict Resolution**: High-performing teams require effective leadership models (e.g., shared leadership, task-oriented leadership, relationship-oriented leadership). Conflict is natural in collaborative engineering; teams must establish constructive conflict resolution protocols (such as collaboration or compromise) and avoid destructive approaches (such as avoidance or accommodation) that lead to unresolved technical disagreements."
        },
        {
          text: "**Multidisciplinary Adaptability**: Software engineers must be prepared to work in multidisciplinary teams (with product managers, designers, QA specialists, and business analysts) and across diverse application domains, understanding that software impacts personal lives and societal systems."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Individual Cognition and Problem Complexity",
      type: "header"
    },
    {
      text: "Software engineering involves highly abstract structures, making individual cognitive processes a critical factor in success. Because human working memory is limited (often characterized by Miller's Law, where individuals can only track a few chunks of information simultaneously), engineers face cognitive overload when dealing with large, monolithic systems.\nAn engineer's ability to decompose problems and design solutions can be inhibited by several factors:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Cognitive Inhibitors**: A lack of domain knowledge, reliance on subconscious assumptions (such as confirmation bias or overconfidence in a design), processing excessive volumes of data, fear of failure, negative organizational culture, inability to express the problem clearly, and emotional or psychological status."
        },
        {
          text: "**Mitigation via Habits**: Developing good problem-solving habits, cultivating intense focus, and practicing intellectual humility. Intellectual humility enables engineers to suspend personal considerations, ask questions, admit when they do not know a solution, and consult peers freely."
        },
        {
          text: "**Cognitive Ergonomics**: Cognitive performance is affected by environmental factors (noise, interruptions, lack of proper tools). Designing workspaces that minimize context switching and interruptions supports deep focus and cognitive flow states."
        },
        {
          text: "**Decomposition**: Because most software engineering problems are too complex for a single individual to solve as a whole, engineers use problem decomposition—breaking down complex systems into smaller, independent, manageable, and highly cohesive modules."
        },
        {
          text: "**Collective Cognition**: Techniques such as pair programming and code reviews leverage collective cognition. By working together, engineers combine different cognitive strengths, views, and experiences to solve problems that would be difficult for an individual to address alone."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Interacting with Stakeholders",
      type: "header"
    },
    {
      text: "The success of a software project depends on positive, active interactions with stakeholders (users, customers, business managers, regulators) across all lifecycle phases:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Requirements Elicitation**: Stakeholders provide critical information, feedback, and constraint definitions. Early identification of all stakeholders is essential to map the product's impact."
        },
        {
          text: "**Expectation Management**: Managing stakeholder expectations requires transparent, regular progress reporting, clearly defined project milestones, and a formal change request process to handle changing requirements without creating friction or distrust."
        },
        {
          text: "**Agile Involvement**: In Agile development, continuous stakeholder involvement is mandatory. Stakeholders provide immediate feedback on working software iterations, clarify specifications, and negotiate priority changes."
        },
        {
          text: "**Maintenance Feedback**: During operations and maintenance, stakeholders report bugs, suggest enhancements, and identify new requirements as their environment changes."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Dealing with Uncertainty and Ambiguity",
      type: "header"
    },
    {
      text: "Software engineers must regularly operate in environments characterized by uncertainty and ambiguity. The engineer is responsible for actively reducing or eliminating any lack of clarity that impedes progress:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Knowledge Gaps**: Uncertainty often reflects a simple lack of information. Engineers resolve this by investigating formal sources (textbooks, professional journals), interviewing stakeholders, or consulting with domain experts."
        },
        {
          text: "**Iterative Prototyping**: Building low-fidelity or high-fidelity prototypes, running spikes, and conducting early user testing are powerful techniques for converting ambiguous requirements into concrete, validated engineering specifications."
        },
        {
          text: "**Risk Management**: When ambiguity cannot be immediately resolved, it must be logged as a project risk. Project estimates, timelines, and budgets must be adjusted to mitigate the potential cost of addressing the unknown factors."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Equity, Diversity, and Inclusivity",
      type: "header"
    },
    {
      text: "Software development projects are frequently divided across national and cultural borders due to the strong trend of international outsourcing and the ease of shipping software components instantaneously around the globe. This makes diversity and equity core operational realities:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Multicultural Environments**: Software engineering teams often consist of people from diverse cultural backgrounds, speaking different native languages and operating under varying social norms. Geographical separation and time zone differences make oral communication less frequent, which elevates the importance of every individual communication contact. Successful collaboration requires team members to embrace tolerance of different cultural and social expectations. Cohesion is actively supported by leadership encouragement, frequent communication (such as structured video conferences and regular face-to-face meetings when feasible), and taking time to communicate in teammates' native languages where possible."
        },
        {
          text: "**Reducing Bias and Gender Inequality**: Gender bias and cultural inequalities remain prevalent in the software industry. To establish a diverse and equitable environment for all software engineers, organizations must implement broader recruiting strategies, establish objective and transparent performance evaluation criteria, and define clear, measurable procedures for assigning compensation and promotions. This reduces bias and improves long-term retention and team dynamics."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "Are individual developer goals explicitly aligned with the team's shared project objectives?"
        },
        {
          text: "Does the team culture encourage intellectual honesty, including admitting ignorance and acknowledging mistakes?"
        },
        {
          text: "Are project tasks, responsibilities, and workloads distributed fairly among team members?"
        },
        {
          text: "Are peer code reviews and design audits conducted in a constructive, non-personal manner?"
        },
        {
          text: "Do team members demonstrate adaptability when collaborating with specialists from other engineering disciplines?"
        },
        {
          text: "Do team members establish constructive conflict resolution protocols to address technical disagreements?"
        },
        {
          text: "Has the project implemented practices (like pair programming or peer reviews) to leverage collective team cognition?"
        },
        {
          text: "Are complex engineering tasks systematically decomposed into smaller, independent modules?"
        },
        {
          text: "Do engineers actively identify and document subconscious assumptions during problem-solving sessions?"
        },
        {
          text: "Does the workspace design minimize interruptions and support cognitive flow and deep focus?"
        },
        {
          text: "Has a complete list of project stakeholders been identified and documented at the start of the lifecycle?"
        },
        {
          text: "Are stakeholders actively involved in validating specifications and giving feedback on working iterations?"
        },
        {
          text: "Are stakeholder expectations managed through transparent, regular progress reporting and milestones?"
        },
        {
          text: "Is stakeholder feedback gathered systematically during the maintenance phase to identify bugs and new requirements?"
        },
        {
          text: "Do engineers resolve uncertainty by consulting formal sources, textbooks, and professional journals?"
        },
        {
          text: "Are iterative prototypes or spikes used to convert ambiguous requirements into concrete specifications?"
        },
        {
          text: "Are unresolved ambiguities logged in the project risk register and factored into estimates and pricing?"
        },
        {
          text: "Has the team established communication protocols to manage geographical and time zone differences effectively?"
        },
        {
          text: "Does team leadership actively support tolerance and understanding of different cultural and social norms?"
        },
        {
          text: "Are face-to-face meetings or video conferences scheduled regularly to maintain team cohesion?"
        },
        {
          text: "Are performance evaluation criteria objective, transparent, and designed to eliminate gender and cultural bias?"
        },
        {
          text: "Has the team implemented strategies to ensure socially inclusive user interface and user experience (UI/UX) designs?"
        },
        {
          text: "Does the organization provide resources for engineers to pursue continuous professional development and training?"
        },
        {
          text: "Are team meeting agendas structured to ensure that all members, regardless of background, can contribute?"
        },
        {
          text: "Are team goals and metrics reviewed regularly to ensure they remain aligned with organizational objectives?"
        },
        {
          text: "Does the team establish psychological safety boundaries to encourage developers to admit uncertainty or design errors?"
        },
        {
          text: "Do engineers utilize collaborative modeling techniques to resolve complex design conflicts?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "group dynamics, psychology, teamwork, goal alignment, intellectual honesty, peer reviews, individual cognition, problem decomposition, pair programming, stakeholders, uncertainty, ambiguity, risk management, diversity, inclusivity, bias reduction",
  filename: "professional-practice-psychology",
  trigger: "model_decision"
});
