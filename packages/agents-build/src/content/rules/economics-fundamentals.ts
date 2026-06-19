import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const economicsFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Economics Fundamentals",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering economics is a core discipline within software engineering that applies economic principles and decision-making techniques to software development, maintenance, and operations. Software engineering decisions are rarely made in a vacuum; they must be evaluated against the constraints of finite resources, organizational goals, and financial viability. By understanding the economic consequences of technical decisions, software engineers can identify the courses of action that deliver the greatest value to the organization and its stakeholders while minimizing cost and risk.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Proposals as Binary Units of Choice",
      type: "header"
    },
    {
      text: "All software engineering decisions begin with the concept of a proposal. A proposal is a single, separate course of action under consideration. It represents a binary unit of choice: the organization either carries out the proposal or chooses not to. Examples of proposals include initiating a specific software development project, redeveloping a legacy software component from scratch, enhancing an existing system feature, or choosing between two different database management engines to implement a system function. Software engineering economics aims to systematically identify the proposals or combinations of proposals that best align with the organization's goals.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Cash Flow Instances, Streams, and Diagrams",
      type: "header"
    },
    {
      text: "To make meaningful decisions about a proposal, engineers must evaluate it from a financial perspective. This evaluation is grounded in the concepts of cash flow instances and cash flow streams:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Cash Flow Instance**: A specific amount of money flowing into or out of the organization at a specific point in time as a direct result of carrying out a proposal. Outgoing cash flows represent expenses, such as developer salaries, equipment purchases, cloud hosting costs, or software licensing fees. Incoming cash flows represent income or savings, such as product sales revenue, subscription fees, transaction charges, or operational cost reductions."
        },
        {
          text: "**Cash Flow Stream**: The complete set of cash flow instances over time caused by carrying out a proposal. The cash flow stream represents the proposal's entire financial profile, defining how much money goes out, when it goes out, how much money comes in, and when it comes in."
        },
        {
          text: "**Cash Flow Diagram**: A two-dimensional graphical summary of a cash flow stream. Time is plotted on the horizontal axis (divided into days, weeks, months, or years), and net money amounts are plotted on the vertical axis. Upward arrows represent incoming cash flows (revenues/savings), while downward arrows represent outgoing cash flows (costs/expenses). The length of each arrow is proportional to the net amount."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 The Time-Value of Money and Interest",
      type: "header"
    },
    {
      text: "One of the most fundamental concepts in economics is that money has a time-value: its value changes over time. A specific amount of money today is worth more than the same amount in the future because of factors such as inflation, opportunity cost, and investment risk. This relationship is mathematically represented through interest. Interest can be viewed as the cost of borrowing capital or the return on invested capital. When software projects span multiple years or involve long-term maintenance commitments, software engineers must account for the time-value of money to ensure that long-term costs are evaluated accurately.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Financial Equivalence and Bases for Comparison",
      type: "header"
    },
    {
      text: "Due to the time-value of money, cash flows occurring at different times cannot be compared directly. Two or more cash flows are economically equivalent only when they represent the same amount of value at the same point in time. To compare different cash flow streams, engineers must convert them to a common point in time using equivalence calculations. This requires selecting an appropriate basis for comparison, which includes:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Present Worth (PW)**: Converting all future cash flows to an equivalent single value at the present time (time zero) using a specified interest rate (discount rate)."
        },
        {
          text: "**Future Worth (FW)**: Converting all cash flows to an equivalent single value at a specified future time."
        },
        {
          text: "**Annual Equivalent (AE)**: Converting a cash flow stream into an equivalent series of equal periodic payments over the planning horizon."
        },
        {
          text: "**Internal Rate of Return (IRR)**: The discount rate at which the present worth of the cash flow stream equals zero, representing the project's internal yield."
        },
        {
          text: "**Discounted Payback Period**: The length of time required for discounted incoming cash flows to recover the discounted initial investment."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Alternatives and the Do-Nothing Option",
      type: "header"
    },
    {
      text: "In practice, organizations face multiple proposals that may have complex interrelationships (e.g., proposal B can only be carried out if proposal A is carried out). To resolve these relationships, software engineers group proposals into mutually exclusive alternatives:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Alternatives**: Mutually exclusive pathways where selecting one alternative precludes selecting any other. The cash flow stream of an alternative is the sum of the cash flow streams of all the proposals it contains."
        },
        {
          text: "**Do-Nothing Alternative**: A special baseline alternative representing the choice not to carry out any of the active proposals under consideration. Choosing the do-nothing option does not mean the organization halts all operations; instead, it indicates that capital and resources will be allocated to other activities outside the current set. The do-nothing alternative must be considered in almost all economic decisions."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Characterizing Intangible and Knowledge Assets",
      type: "header"
    },
    {
      text: "Many economic factors in software engineering cannot be easily quantified in monetary terms. Intangible assets, also known as knowledge assets, are non-monetary assets that lack physical substance but grant rights and economic benefits to their owner. These assets reside in the non-visible side of the organization but significantly influence financial performance. Examples include documented development policies, software processes, checklists, templates, coding standards, developer experience, and domain know-how. Understanding these assets helps engineers identify hidden risks and opportunities, ensuring that proposed software solutions fit the organization's capabilities.",
      type: "text"
    },
    {
      level: 3,
      text: "1.7 Business Model Alignment and Economic Logic",
      type: "header"
    },
    {
      text: "A software proposal's success is tied to its alignment with the organization's business model. A good business model, as defined by management theorist Peter Drucker, must answer four fundamental questions:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Who is the customer?** Identifying the target users, buyers, or client segments."
        },
        {
          text: "**What does the customer value?** Understanding the specific utility, efficiency, or experience the customer seeks."
        },
        {
          text: "**How do we make money?** Defining the revenue streams (e.g., subscription fees, transaction charges, software licenses) that sustain the business."
        },
        {
          text: "**What is the underlying economic logic?** Explaining how the organization can deliver value to customers at a cost that ensures long-term viability.\nSoftware engineers must analyze the business model to ensure that their technical proposals support the broader economic logic of the enterprise."
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
          text: "**Proposal Definition**: Has the technical choice been clearly defined as a binary proposal (to carry out or not carry out a specific action)?"
        },
        {
          text: "**Cash Flow Identification**: Have all cash flow instances (both incoming revenues/savings and outgoing expenses) been identified for the proposal?"
        },
        {
          text: "**Cash Flow Stream Compilation**: Has the complete cash flow stream been compiled, detailing the exact timing and magnitude of each cash flow instance?"
        },
        {
          text: "**Cash Flow Diagramming**: Has a cash flow diagram been constructed to visually represent and summarize the timing and direction of all cash flows?"
        },
        {
          text: "**Time-Value Application**: Have all future cash flows been adjusted using an appropriate interest or discount rate to account for the time-value of money?"
        },
        {
          text: "**Equivalence Calibration**: Have cash flows from different time periods been converted to a common point in time before making comparison decisions?"
        },
        {
          text: "**Bases for Comparison Selection**: Has an appropriate basis for comparison (e.g., Present Worth, Future Worth, Annual Equivalent, or IRR) been selected and documented?"
        },
        {
          text: "**Mutually Exclusive Alternatives**: Have all individual proposals and their interdependencies been combined into a set of mutually exclusive alternatives?"
        },
        {
          text: "**Do-Nothing Baseline**: Has the do-nothing alternative been explicitly included in the analysis as a baseline for comparison?"
        },
        {
          text: "**Intangible Asset Identification**: Have the organization's intangible assets (policies, processes, culture, know-how) relevant to the proposal been identified?"
        },
        {
          text: "**Intangible Value Assessment**: Has a qualitative or quantitative value been assigned to intangible assets to account for their impact on project risk?"
        },
        {
          text: "**Drucker Customer Definition**: Has the target customer or user for the software proposal been clearly defined?"
        },
        {
          text: "**Drucker Value Proposition**: Has the specific value or utility that the customer receives from the software proposal been articulated?"
        },
        {
          text: "**Drucker Revenue Mechanism**: Has the mechanism by which the organization recovers cost or generates revenue from the proposal been defined?"
        },
        {
          text: "**Drucker Economic Logic**: Is there a clear explanation of how the proposal delivers value to customers at an acceptable cost to the organization?"
        },
        {
          text: "**Alternative Comparison**: Have the cash flow streams of all mutually exclusive alternatives been compared using the same basis and time frame?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software engineering economics fundamentals, proposals, cash flow instances, cash flow streams, cash flow diagrams, time value of money, financial equivalence, bases for comparison, present worth, future worth, annual equivalent, internal rate of return, discounted payback period, mutually exclusive alternatives, do nothing alternative, intangible assets, knowledge assets, business models, peter drucker",
  filename: "economics-fundamentals",
  trigger: "model_decision"
});
