---
description: "Software Operations: deployment, release, operations, and infrastructure"
trigger: model_decision
---

# Software Engineering Operations (SWEBOK v4, Chapter 6)

> **Scope:** Activities to deploy, operate, and support software while preserving integrity and stability — from pre-delivery planning through post-release incident control. Covers DevOps/DevSecOps practices, IaC, release strategies, incident management, monitoring, and CI/CD tooling. (ISO/IEC/IEEE 20000-1, 12207, 32675)

## When to Apply

Invoke this chapter when working on: deployment pipelines, release strategy selection, incident response, rollback planning, monitoring/alerting, IaC changes, environment configuration, capacity planning, DR/failover, CI/CD setup.

## Key Definitions

| Term | Definition |
|---|---|
| **Deployment** | Installation of a specified version of software to a given environment |
| **Release** | Making a feature available to all or a segment of customers (business decision) |
| **IaC** | Infrastructure as Code — desired state configuration managed and versioned like source code |
| **SRE** | Site Reliability Engineering — monitors/automates operations for availability, performance, latency, security, capacity |
| **SLA** | Service-Level Agreement — documents agreed availability/performance obligations |
| **CONOPS** | Concept of Operations — how users request modifications and report problems during operations |
| **Canary release** | Partial, time-limited deployment to evaluate change before full rollout |
| **Feature toggle** | Config parameter that enables/disables a code section without redeployment |
| **Blue/green** | Two identical environments; traffic switches from old (blue) to new (green) |

## Operations Process Groups

Three groups, each active across pre- and post-delivery:

| Group | Key Activities |
|---|---|
| **Planning** | Operations plan/CONOPS, supplier management, environments, SLAs, capacity, backup/DR, security controls |
| **Delivery** | Operational testing (TDD/ATDD), deployment/release engineering, rollback and data migration, problem resolution |
| **Control** | Incident management, change management, monitor/measure/track/review, operations support, service reporting |

## Deployment Strategy Selection

Select strategy based on risk level and rollback requirements:

| Strategy | Type | When to Use | Rollback Mechanism |
|---|---|---|---|
| **Canary** | Environment-based | High-risk change; need real-traffic validation before full rollout | Route traffic back; auto-rollback if validation period fails |
| **Blue/Green** | Environment-based | Need zero-downtime cutover; fast full rollback required | Switch traffic back to blue environment |
| **Feature toggle** | Application-based | Want to deploy code without releasing; decouple deploy from release | Toggle flag off; no environment swap needed |
| **Direct deploy** | — | Low-risk; full rollback acceptable; no staged validation needed | Redeploy previous version |

Environment-based strategies require a staging environment provisioned identically to production (IaC enforces this). Application-based strategies require the application to be architected for independent, small deployments.

## Rollback Decision Rules

Trigger rollback when any of the following occur after deployment:

| Signal | Rollback Trigger |
|---|---|
| Smoke tests fail | Immediate — do not route production traffic |
| Error rate exceeds pre-agreed threshold during canary window | Automatic rollback via surveillance daemon |
| Deployment health check timeout | Automatic rollback before user impact |
| Manual post-deploy verification fails | Rollback before next business period |
| Data migration produces integrity errors | Roll back data migration first, then application |

Rollback must be planned and rehearsed BEFORE deployment. Both environment-based and application-based strategies support rollback. DevOps automates rollback fast enough that end users may not notice.

## Incident Management Procedure

Lifecycle: **record → prioritize → assess business impact → resolve → escalate → close → post-mortem**

| Step | Requirement |
|---|---|
| Record | Log all incidents with timestamp, symptoms, affected services |
| Prioritize | Classify by business impact (emergency / urgent / major / minor) |
| Resolve | Run diagnostics; replicate and verify problem reports before fixing |
| Post-mortem | Mandatory after every incident — identify source, implement prevention |

Automate surveillance (alerts + logs) to catch minor incidents before they escalate. Change management classifies all change requests the same way: emergency / urgent / major / minor.

## Planning Requirements

Operations planning must begin when development starts (not after launch):

- CONOPS specifies how users request changes and report problems
- Capacity plan produced at least annually; documents costed options for meeting SLA targets
- All environments automated from a single code repository (single source of truth)
- Backup/DR tested regularly — preparedness rehearsed whenever production changes
- Security policy defined by senior management; roles assigned; staff trained; incidents follow incident management procedures

## Monitoring KPIs

Instrument before shipping. Engineers informed with evidence, not hope:

- Production system monitoring and product telemetry (application, OS, infrastructure layers)
- Verification/validation results before and after release
- End-user activity and resource use
- Configuration changes unrelated to approved deployment tasks
- Security and resilience performance capability

Service reports must cover: performance vs. SLA targets, security breaches, transaction volume, incidents/failures, trend information, satisfaction analysis.

## Decision Checklist

**Must Do**
- [ ] Rollback plan documented and rehearsed before every deployment
- [ ] Smoke tests run automatically post-deploy before traffic routes
- [ ] Monitoring and alerting instrumented before feature ships to production
- [ ] Infrastructure changes use IaC — committed, reviewed, CI-tested
- [ ] All incidents trigger a post-mortem with follow-up action items
- [ ] Backup and DR tested regularly (not just planned)
- [ ] Deployment strategy chosen based on risk profile (see selection table above)
- [ ] Operations planning started at project inception, not after launch

**Must Not**
- [ ] Deploy without a rollback mechanism
- [ ] Release without automated smoke tests
- [ ] Leave DR plan untested
- [ ] Skip post-mortems ("it's fixed, move on")
- [ ] Allow security to be a post-deployment concern (DevSecOps violation)

## Anti-Patterns

| Anti-Pattern | Consequence |
|---|---|
| Manual deployments with no automation | Inconsistent, slow, error-prone releases |
| No rollback plan | Outage extends until hotfix is ready |
| No telemetry/alerts | Reactive-only; customers report problems before engineers know |
| Big-bang releases | High blast radius; canary/toggle impossible after the fact |
| Environments not synchronized with production | Bugs only appear in production |
| DR plan never tested | Recovery fails when needed most |
| Operations team learns about features at deploy time | Siloed knowledge; no ops readiness |
| Security added post-deployment | Vulnerabilities ship; remediation costs multiply |

## Standards Referenced

| Standard | Scope |
|---|---|
| ISO/IEC/IEEE 20000-1 | IT Service Management system requirements |
| ISO/IEC/IEEE 12207 | Software Life Cycle Processes — operations technical processes |
| ISO/IEC/IEEE 32675 | DevOps: Agile/IaC/MVP perspective on operations activities |
| ISO/IEC 29110 | Lifecycle profiles adapted for very small entities (≤25 people) |
