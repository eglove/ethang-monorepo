---
description: architectural tactics, availability, performance, and security gates
trigger: model_decision
---

# Architectural Tactics

## 1. Domain Theory and Conceptual Foundations
Architectural tactics are targeted design decisions used to control and satisfy specific quality attribute responses, such as system availability, performance, security, and modifiability. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design), tactics are the building blocks of architectural patterns. While an architectural pattern represents a collection of decisions, a tactic targets a single quality attribute response.

### 1.1 Availability Tactics
Availability focuses on system uptime and the ability to continue executing correctly despite component failures. Tactics are divided into three areas:
- **Fault Detection**: Identifying anomalies before they lead to system crashes. Common tactics include **ping-echo** (periodic status requests), **heartbeat** (components broadcasting their health to a monitor), and **exception detection** (logging execution faults).
- **Fault Recovery**: Restoring the system to a safe state after a failure. Tactics include **active redundancy** (replicating state to parallel nodes), **passive redundancy** (standby replicas updated periodically), and **checkpoints/rollback** (saving transaction states so execution can revert to a known valid point).
- **Fault Prevention**: Avoiding failures entirely. Tactics include **removal from service** (temporarily disabling a failing node for maintenance) and **transactions** (ensuring all-or-nothing operations to prevent corrupt states).

### 1.2 Performance Tactics
Performance is the system's ability to satisfy timing and throughput requirements under varying workloads. Tactics focus on:
- **Managing Resource Demand**: Controlling when and how work is processed. Tactics include **rate limiting** (throttling client request rates), **load shedding** (rejecting requests when queues are full), and **event coalescing** (batching multiple individual updates into a single transaction).
- **Managing Resources**: Optimizing execution speed and storage limits. Tactics include **caching** (saving expensive query results in-memory), **database indexing** (reducing search lookups), **parallel processing** (splitting execution across concurrent threads), and **horizontal scaling** (replicating serverless nodes).

### 1.3 Security Tactics
Security measures the system's capability to protect data, resist attacks, and recover from security events. Tactics include:
- **Resisting Attacks**: Intercepting malicious traffic before it affects system state. Tactics include **authentication** (verifying identity), **authorization** (verifying permissions using Role-Based Access Control), **input sanitization** (defending against injection attacks), and **encryption** (protecting data-at-rest and data-in-transit).
- **Detecting Attacks**: Identifying unauthorized behaviors. Tactics include **audit trails** (logging all administrative actions and authentication events) and **integrity checks** (validating hash signatures on files or data blocks).
- **Recovering from Attacks**: Reverting to a secure state. Tactics include **backups** and **automated session rotation** (invalidating tokens when anomalies are detected).

### 1.4 Modifiability Tactics
Modifiability measures how easily a system can accommodate changes (e.g., adding features, updating dependencies, or refactoring). Tactics focus on:
- **Localizing Changes**: Minimizing the change propagation path. Tactics include **semantic cohesion** (grouping related functionality in a single module), **encapsulation** (hiding module internals), and **interface control** (defining strict client APIs).
- **Deferring Binding Time**: Decoupling the design time from execution time. Tactics include **configuration files** (controlling behavior at startup) and **polymorphism** (swapping implementations dynamically at runtime).

### 1.5 Modifiability and Binding Time Tactics
Binding time refers to when a software decision is resolved. Deferring binding time increases modifiability:
- **Design Time**: Decisions hardcoded by developers in source files. This is the least modifiable, requiring recompilation to alter.
- **Compile Time**: Decisions resolved by compiler flags or preprocessors (e.g., swapping API endpoints based on environment flags during build compilation).
- **Deployment Time**: Decisions resolved during server startup or container launching (e.g., loading database credentials from environment variables).
- **Runtime**: Decisions resolved dynamically during execution (e.g., loading user language preferences from request headers, or resolving class implementations via dependency injection registries).

By deferring binding times, engineers allow the system to adapt to new environments and user behaviors without requiring rebuild cycles.

### 1.6 Availability and Fault Recovery Tactics
Building fault-tolerant systems in edge/distributed runtimes requires implementing rigorous recovery tactics:
- **Active Redundancy (Hot Standby)**: Replicating state updates synchronously to secondary systems. If the primary node fails, the secondary immediately assumes processing with zero state loss, though it incurs high synchronization costs.
- **Passive Redundancy (Warm Standby)**: State updates are replicated asynchronously. The standby system remains inactive until the primary fails, risking minor data loss (equivalent to the replication lag) but reducing write latency.
- **Rollback and Checkpointing**: Saving system state snapshots to durable storage (e.g., KV or D1 databases) at critical checkpoints. If a transactional execution path crashes, the worker reads the last valid checkpoint and retries or rolls back the transaction, preventing database inconsistency.

## 2. Standard Operating Procedures (SOP)
The agent must apply the following step-by-step procedures when designing for quality attributes:

### Step 2.1: Map Quality Attributes to Tactics
Before writing code, the agent must identify the quality attributes of the feature and map them to specific tactics in the `implementation_plan.md`:
- Availability: Specify fault detection and recovery mechanisms.
- Performance: Specify caching, database query plans, and concurrency strategies.
- Security: Define authentication, authorization, and sanitization boundaries.
- Modifiability: Plan class encapsulation and dependency directories.

### Step 2.2: Implement Fault Detection and Heartbeats
For critical background services, integrations, or workers:
- Implement standardized ping/health-check endpoints returning system status.
- Implement structured exception logging to detect runtime faults immediately.

### Step 2.3: Configure Performance Management Tactics
Implement resource and demand management:
- Apply caching structures for static or read-heavy assets, defining explicit Cache-Control headers or KV cache lifespans.
- Implement database indexing on foreign keys and search criteria.
- Register rate-limiting middleware to protect endpoints from overload.

### Step 2.4: Integrate Attack Resistance Gates
Secure code boundaries by adding security checks:
- Implement input validation schemas (using libraries like Zod) to validate and sanitize all client request bodies.
- Verify that authorization middleware intercepts routing access.
- Ensure all sensitive data (PII, configuration secrets) is encrypted.

### Step 2.5: Verify Tactics with Failure-Path Tests
Implement unit and integration tests to verify quality attribute behaviors:
- Assert that rate limiters return HTTP 429 status codes when request limits are exceeded.
- Mock network timeouts to assert that checkpoint/retry logic recovers successfully.
- Test that input validation schemas reject invalid inputs with structured errors.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding architectural tactics:

- [ ] **Quality Attribute Mapping**: Have all proposed features been mapped to specific architectural tactics?
- [ ] **Fault Detection heartbeats**: Are health check/ping endpoints configured for critical services?
- [ ] **Exception Logging**: Do all catch blocks log exceptions with structured data to ensure fault visibility?
- [ ] **Passive/Active Redundancy**: Is it documented whether data replication uses synchronous (active) or asynchronous (passive) redundancy?
- [ ] **Database Transaction boundaries**: Are multi-table database operations wrapped in transactions to enable rollbacks?
- [ ] **Rate-Limiting Middleware**: Is rate-limiting configured on all public endpoint routes?
- [ ] **Cache Policy Definitions**: Are TTL policies and Cache-Control headers explicitly defined for caching layers?
- [ ] **Database Index Verification**: Has the agent verified that indexes exist for all query filter columns?
- [ ] **Zod Input Validation**: Are all incoming API payloads validated using schemas like Zod?
- [ ] **Authorization Middlewares**: Do all sensitive routes pass through role-based authorization gates?
- [ ] **Data Encryption**: Is PII and credential data encrypted at rest and in transit?
- [ ] **Dynamic Binding**: Are environment-dependent variables loaded dynamically from configuration files or environment variables?
- [ ] **Encapsulation Audit**: Are class properties and methods encapsulated (using private/protected keywords) where appropriate?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Failure-Path Test Coverage**: Have unit tests been written that mock network or component failures to assert failover paths?
- [ ] **Walkthrough Verification**: Does the `walkthrough.md` document how the implemented tactics satisfy the quality attributes?
- [ ] **Task List Sync**: Do tasks in `task.md` outline the step-by-step integration of security and performance tactics?
- [ ] **Conceptual Integrity Audit**: Did the agent verify that the chosen tactics align with existing patterns in the monorepo?
- [ ] **Explicit Member Access**: Are all methods and properties on synthesized tactic classes declared with explicit accessibility modifiers?
