import { defineRule } from "../../define.ts";

export const operationsMonitoring = defineRule({
  content: `# Operations Monitoring

## 1. Domain Theory and Conceptual Foundations
Operations monitoring provides continuous visibility into the runtime health, performance, and operational metrics of production software systems. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 12 (Software Maintenance) and Chapter 7 (Software Engineering Management), monitoring is a core discipline of modern software operations. It bridges the gap between post-release deployment and ongoing software maintenance, ensuring that systems remain reliable, performant, and aligned with organizational goals.

### 1.1 The SLA, SLO, and SLI Framework
Monitoring is governed by a hierarchical metrics framework that translates technical indicators into business objectives:
- **Service Level Indicator (SLI)**: A quantifiable metric that measures the service performance from the perspective of the customer. Examples include request latency, error rate, throughput, and system availability.
- **Service Level Objective (SLO)**: A target reliability metric defined for an SLI. It specifies the acceptable level of service performance (e.g., "99% of requests must complete in less than 200ms").
- **Service Level Agreement (SLA)**: A formal contract between a service provider and its users, specifying the legal and financial consequences of failing to meet the agreed SLOs.

Mathematically, the availability ($$A$$) of a service over a measurement window ($$T$$) is defined as:
$$A = \\frac{T_{\\text{uptime}}}{T} \\times 100\\%$$

To remain compliant with an SLA, the system's actual SLI performance must strictly exceed the target SLO:
$$SLI \\ge SLO$$

The margin between the SLO and 100% availability is the **Error Budget**. For a service targeting $99.9\\%$ availability, the error budget is $0.1\\%$. If this budget is exhausted within a given period, new deployments are frozen, and engineering effort is redirected entirely to stability improvements.

### 1.2 The Four Golden Signals
An effective operations monitoring strategy focuses on the "Four Golden Signals" of web service reliability:
1. **Latency**: The time it takes to service a request, carefully separating successful requests from failed requests.
2. **Traffic**: A measure of the demand placed on the system (e.g., HTTP requests per second or database transactions per second).
3. **Errors**: The rate of requests that fail, either explicitly (e.g., HTTP 5xx responses) or implicitly (e.g., HTTP 2xx responses containing incorrect payload data).
4. **Saturation**: A measure of system fullness, highlighting resource constraints before bottlenecks occur (e.g., memory usage, CPU load, database connection pool utilization).

### 1.3 Structured Logging and Contextual Tracing
Standard, unstructured log strings are difficult to parse and query at scale. SWEBOK-aligned systems enforce **Structured Logging**, where logs are written as standardized JSON objects containing contextual metadata:
- **Timestamp**: High-precision UTC ISO 8601 format.
- **Log Level**: Standardized classification (DEBUG, INFO, WARN, ERROR, FATAL).
- **Correlation ID (Trace ID)**: A unique identifier propagated across distributed service boundaries, allowing engineers to trace a single transaction through the entire system path.
- **Contextual Data**: Key-value pairs representing request paths, user IDs, database query times, and environment indicators.

### 1.4 Capacity Management and Trend Analysis
Capacity management is a proactive engineering discipline that ensures IT infrastructure is sized correctly to meet current and future business demands cost-effectively. SWEBOK v4 highlights capacity management as a key factor in preventive maintenance. Engineers use historical metric trends to build predictive models for resource consumption:
$$Resource(t) = Resource_0 + \\beta \\cdot Traffic(t) + \\epsilon$$

Where:
- $Resource(t)$ is the estimated resource utilization at time $t$.
- $Resource_0$ is the baseline idle overhead of the service.
- $\\beta$ is the resource consumption coefficient per unit of traffic.
- $Traffic(t)$ is the projected user demand.
- $\\epsilon$ represents environmental variance.

Using linear regression and time-series analysis, capacity planners predict when disk space, database connection capacity, or memory allocation boundaries will be breached, scheduling infrastructure scaling events before system degradation occurs.

### 1.5 Serverless and Edge-Native Monitoring Challenges
Deploying applications on serverless runtimes (such as Cloudflare Workers) introduces unique monitoring constraints. Unlike traditional servers where resource metrics are persistent, serverless instances are ephemeral. Monitoring must capture cold starts, event loop delays, and strict CPU execution times. Because resources are billed per millisecond of execution, monitoring latency and memory usage directly impacts cost optimization.

## 2. Standard Operating Procedures (SOP)
The agent must execute operations monitoring configurations according to the following step-by-step procedures:

### Step 2.1: Establish the Metrics Inventory
For every application service, define and document the core SLIs, SLOs, and SLAs. Maintain this inventory in the system documentation:
- Define the metrics representing service health (e.g., HTTP error counts, event queue lags).
- Establish warning and critical thresholds for each metric based on historical performance baselines.

### Step 2.2: Implement Structured JSON Logging
Configure the application logger to output structured JSON objects. Ensure all logs contain a standardized schema:
- Avoid multi-line logs; serialize stack traces into a single JSON property.
- Integrate a correlation middleware to inject unique request IDs into the log context at the entry point of every HTTP request.

### Step 2.3: Instrument Metrics Collection
Inject metric collection hooks into key components:
- Instrument HTTP routing middlewares to record response latency and status codes.
- Instrument database clients to track query times and connection pool saturation.
- Inject system hooks to monitor node process metrics (such as memory usage, garbage collection frequency, and event loop lag).

### Step 2.4: Configure Alerting Rules
Create alerting definitions based on the SLOs and golden signals:
- Configure alerts with appropriate evaluation windows (e.g., trigger an alert if the error rate exceeds 2% over a 5-minute window).
- Define severity levels: Page (immediate intervention required, e.g., service down) versus Ticket (non-blocking anomaly to be resolved during business hours).
- Avoid flapping alerts by implementing alert hysteresis (different trigger and resolve thresholds).

### Step 2.5: Aggregate and Visualize Data
Set up centralized dashboards to aggregate logs and metrics:
- Organize dashboards logically, placing high-level SLO compliance charts at the top and detailed system metrics (CPU, memory, disk) below.
- Ensure all charts support time-range filtering and comparative overlays (e.g., comparing today's traffic against the same day last week).

### Step 2.6: Conduct Capacity Reviews
Perform monthly capacity reviews using aggregated metric histories:
- Calculate peak-to-average ratios for traffic and resource utilization.
- Apply forecasting formulas to estimate resource exhaustion timelines.
- Document capacity optimization recommendations in the project's documentation.

### Step 2.7: Iterate and Refine
Review alert accuracy following production incidents:
- If an incident occurred without triggering an alert, update the threshold or introduce a new SLI.
- If alerts triggered without a real issue (false positives), adjust the evaluation windows or thresholds to prevent alert fatigue.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following operations monitoring rules:

- [ ] **SLIs/SLOs Defined**: Did the agent define clear Service Level Indicators and objectives for the modified services?
- [ ] **Structured Logging Integrated**: Are all log messages structured as JSON objects containing standardized metadata?
- [ ] **Correlation IDs Propagated**: Do logs include trace/correlation IDs to track transactions across service boundaries?
- [ ] **Four Golden Signals Monitored**: Are Latency, Traffic, Errors, and Saturation represented in the monitoring setup?
- [ ] **Ephemeral Context Supported**: Does the monitoring configuration handle serverless/edge runtime constraints (e.g., Cloudflare Worker execution limits)?
- [ ] **No Native Dates in Metrics**: Are date and timestamp formatting operations handled strictly via Luxon (\`DateTime\`)?
- [ ] **Index Signature Safety**: Do metric serializing utilities access properties on index-signature objects via bracket notation?
- [ ] **Memory Leaks Prevented**: Are logging and metrics-gathering hooks free of memory leaks (e.g. unsubscribed events, unbounded buffers)?
- [ ] **Void Assertions Wrapped**: Are test cases verifying logging modules wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Complexity Limits Respected**: Are log preprocessing functions written with low cognitive complexity (avoiding deep nesting)?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted \`git restore\` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Runs Completed**: Did the agent execute compile, lint, and test checks using the \`rtk\` command prefix?
- [ ] **Walkthrough Updated**: Is the monitoring strategy, metric definitions, and verification results recorded in \`walkthrough.md\`?
- [ ] **Errors Classified Correctly**: Are internal errors separated from client errors (e.g., HTTP 4xx vs 5xx) in error rate calculations?
- [ ] **Capacity Model Forecasted**: Did the agent document a resource consumption forecast or capacity estimate for major changes?
- [ ] **Alerting Thresholds Documented**: Are alert triggers, severities, and notification channels documented for critical SLOs?`,
  description:
    "operations monitoring, capacity management, SLA metrics, and structured logging",
  filename: "operations-monitoring",
  trigger: "model_decision"
});
