import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const computingFoundationsAiMl = defineRule({
  content: [
    {
      level: 1,
      text: "Artificial Intelligence and Machine Learning",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Artificial Intelligence (AI) and Machine Learning (ML) are transforming modern computing systems. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 16, Section 9, software engineers must understand the core concepts of AI and ML to design, evaluate, and maintain intelligent systems. AI represents the capability of a system to acquire and correlate information to make correct decisions, while ML enables systems to learn from experience and training data rather than relying purely on explicit, hardcoded logic. Deep learning builds upon these foundations by employing multi-layered artificial neural network models to solve complex predictive and perceptual tasks.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Types of Reasoning in AI",
      type: "header"
    },
    {
      text: "Reasoning is the logical process of analyzing available information to determine the cause of a situation or decide on the next action. AI systems employ several reasoning frameworks:",
      type: "text"
    },
    {
      items: [
        {
          text: '**Deductive Reasoning**: Maps established, authentic premises directly to a certain conclusion. For example, if "All database transactions require a commit" and "Write operation X is a database transaction," then "Write operation X requires a commit."'
        },
        {
          text: "**Inductive Reasoning**: Formulates general hypotheses and rules from specific observed facts. The resulting conclusion is probable rather than certain (e.g., observing that all tested endpoints use JSON, and concluding that all endpoints in the system use JSON)."
        },
        {
          text: "**Abductive Reasoning**: Starts with an incomplete set of observations and infers the most likely or plausible explanation (e.g., diagnostic systems analyzing system logs to locate a server crash)."
        },
        {
          text: "**Common Sense Reasoning**: Makes inferences based on heuristics and past experiences of physical or social behaviors."
        },
        {
          text: "**Monotonic Reasoning**: Assumes that once a conclusion is reached, it remains permanently true, regardless of new data."
        },
        {
          text: "**Non-Monotonic Reasoning (NMR)**: Allows conclusions to be retracted or altered when new information becomes available, which is essential for handling real-world uncertainty (e.g., assuming a service is online, but retracting that assumption when a timeout occurs).\nEngineers should also understand metalevel, procedural numeric, and formal mathematical reasoning."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Learning Paradigms",
      type: "header"
    },
    {
      text: "ML systems rely on different learning paradigms depending on data availability and the target problem:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Supervised Learning**: The model is trained on labeled datasets containing input-output pairs. It utilizes classification (predicting discrete classes) and regression (predicting continuous values) techniques."
        },
        {
          text: "**Unsupervised Learning**: The model receives unlabeled data and must identify internal structures, patterns, or groupings (clustering) in real time without human guidance."
        },
        {
          text: "**Semi-Supervised Learning**: Integrates a small amount of labeled data with a large volume of unlabeled data to improve training efficiency and accuracy."
        },
        {
          text: "**Reinforcement Learning**: The system learns by interacting with an environment, receiving feedback in the form of rewards or penalties. It relies on trial-and-error exploration rather than pre-provided training samples.\nOther advanced learning techniques include dimensionality reduction, self-learning, feature representation learning, sparse learning, anomaly detection, and robot learning."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Machine Learning Models",
      type: "header"
    },
    {
      text: "Selecting the correct model requires evaluating the problem structure, data volume, and performance constraints:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Linear Regression**: Maps linear relationships between continuous input and output variables."
        },
        {
          text: "**Logistic Regression**: A statistical model used for binary classification."
        },
        {
          text: "**Decision Trees**: A flow-chart-like structure representing sequential decisions, offering high interpretability."
        },
        {
          text: "**Naïve Bayes**: A classification model based on Bayes' theorem, assuming absolute independence between features. It is widely used in spam filtering."
        },
        {
          text: "**Support Vector Machines (SVM)**: Identifies optimal decision boundaries (hyperplanes) to classify data. SVMs are highly effective for high-dimensional, small-to-medium datasets."
        },
        {
          text: "**Artificial Neural Networks (ANN)**: Mathematical structures modeled after biological brains, capable of learning non-linear patterns through backpropagation."
        },
        {
          text: "**Random Forests**: An ensemble method that combines multiple decision trees to improve classification accuracy and prevent overfitting.\nAdvanced models include Linear Discriminant Analysis, Learning Vector Quantization, and K-Nearest Neighbors (KNN)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Perception, Sensors, and Problem-Solving",
      type: "header"
    },
    {
      text: "AI systems interact with the physical and digital world through perception and problem-solving mechanisms:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Sensors**: Gathering external environmental data using cameras, microphones, temperature probes, light sensors, or network traffic monitors."
        },
        {
          text: "**Problem-Solving**: Utilizing a structured knowledge base and predicate logic to identify optimal execution paths. The system parses sensory inputs, references its knowledge rules, and triggers actuators or digital commands to execute actions."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Taxonomy of AI Systems",
      type: "header"
    },
    {
      text: "AI capabilities are classified into three major categories:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Type I AI**: Designed to execute specific, narrow tasks with intelligence (e.g., chess engines, facial recognition, speech translation)."
        },
        {
          text: "**Type II AI (Reactive Machines)**: Analyzes current environmental data to make immediate decisions without referring to past historical actions or storing memories (e.g., classic self-driving vehicle systems)."
        },
        {
          text: '**Type III AI (Self-Aware/Conscious)**: Systems possessing self-awareness, mindful operations, and the ability to apply "theory of mind" to understand and predict human emotional states, social contexts, and ethical boundaries.'
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Natural Language Processing (NLP)",
      type: "header"
    },
    {
      text: "NLP enables computers to understand, interpret, and generate human languages. The system must process:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Lexical and Syntactic Structures**: Parsing grammar, vocabulary, and sentence structures."
        },
        {
          text: "**Semantics and Pragmatics**: Determining the actual meaning of words in context, accounting for slang, pronunciation, and regional accents."
        },
        {
          text: "**Acoustic and Language Models**: Converting spoken words into structured digital tokens for interpretation."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.7 AI for Software Engineering (AI for SE)",
      type: "header"
    },
    {
      text: "AI applications can optimize the software engineering lifecycle by replicating developer behaviors:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Applications**: Automating test case generation, predicting code defects, conducting vulnerability analysis, and assessing engineering processes."
        },
        {
          text: "**Limitations**: AI models exhibit stochastic and uncertain behaviors, meaning they can produce non-deterministic outputs. Engineers must establish validation gates, as AI-generated code or tests require strict human-in-the-loop auditing and structured verification datasets to prevent regressions."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.8 Software Engineering for AI Systems (SE for AI)",
      type: "header"
    },
    {
      text: "Building AI-based systems is fundamentally different from traditional programming. In traditional systems, behavior is defined by code; in AI systems, behavior is inferred from training data:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Interdisciplinary Collaboration**: Requires collaborative teams consisting of data scientists (focused on models and training) and software engineers (focused on integration, scalability, and deployment)."
        },
        {
          text: "**Data Evolution**: Continuous deployment requires managing versioning for code, models, and massive, frequently changing training datasets."
        },
        {
          text: "**Ethics and Equity Requirements**: Requirements engineering must define clear guardrails for bias reduction, transparency, data privacy, and ethical compliance."
        },
        {
          text: "**Design Patterns**: Utilizing ML software design patterns to separate model ingestion, training pipelines, inference services, and monitoring loops."
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
          text: "**AI Project Classification**: Has the intelligent system been classified as Type I (narrow task), Type II (reactive), or Type III (self-aware) to establish architectural boundaries?"
        },
        {
          text: "**Reasoning Model Suitability**: Has the reasoning model (deductive, inductive, abductive, NMR) been evaluated and documented for the specific decision-making domain?"
        },
        {
          text: "**Non-Monotonic State Handling**: If Non-Monotonic Reasoning is used, does the system safely retract invalid inferences when new environmental data is received?"
        },
        {
          text: "**Learning Paradigm Selection**: Has the learning paradigm (supervised, unsupervised, reinforcement) been selected based on labeled data availability and feedback mechanisms?"
        },
        {
          text: "**Model Evaluation Criteria**: Have model selection criteria (interpretability vs. accuracy, training time, CPU/GPU resource usage) been documented for the selected algorithms?"
        },
        {
          text: "**Sensor Calibration and Failure Modes**: Are there fallback strategies defined for when physical or digital sensors fail or send malformed data?"
        },
        {
          text: "**Predicate Logic Completeness**: Has the knowledge base and predicate logic been audited to prevent infinite loops or unreachable states?"
        },
        {
          text: "**NLP Slang and Accent Handling**: Does the NLP interface account for variations in pronunciation, slang, and ambient noise?"
        },
        {
          text: "**AI-Generated Code Verification**: Are all AI-generated code snippets and test cases subjected to automated syntax, linting, and security scan gates before integration?"
        },
        {
          text: "**Stochastic Output Guardrails**: Does the system incorporate deterministic software wrappers around stochastic AI model outputs to prevent unexpected actions?"
        },
        {
          text: "**Interdisciplinary Boundary Definition**: Are the interfaces and handoffs between the data science training pipeline and the production software system documented?"
        },
        {
          text: "**Model and Dataset Versioning**: Is there a configuration management baseline established that links specific model versions to their training datasets and source code?"
        },
        {
          text: "**Ethics and Bias Auditing**: Has the training dataset been audited for bias, equity, privacy compliance, and ethical safety boundaries?"
        },
        {
          text: "**ML Design Pattern Application**: Does the system architecture separate data preprocessing, model inference, and performance telemetry monitoring?"
        },
        {
          text: "**Continuous Telemetry Validation**: Is there real-time monitoring established to detect model drift, input distribution shifts, and performance degradation?"
        },
        {
          text: "**Training Data Cleanliness**: Has the training data undergone preprocessing, normalisation, and outlier removal before ingestion?"
        },
        {
          text: "**Verification Dataset Integrity**: Is the validation dataset kept completely separate from the training dataset to ensure unbiased evaluation?"
        },
        {
          text: "**Model Fallback and Rollback**: Is there a documented procedure for rolling back models or falling back to a rule-based deterministic controller if model drift occurs?"
        },
        {
          text: "**Adversarial Hardening**: Has the ML model been tested against evasion attacks, model poisoning, and adversarial inputs?"
        },
        {
          text: "**Resource Optimization**: Have model optimization techniques (quantization, pruning) been evaluated to fit deployment hardware constraints?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "artificial intelligence, machine learning, deep learning, reasoning models, learning paradigms, ML models, natural language processing, software engineering for AI",
  filename: "computing-foundations-ai-ml",
  trigger: "model_decision"
});
