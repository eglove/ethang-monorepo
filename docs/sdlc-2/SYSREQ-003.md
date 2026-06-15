---
id: "SYSREQ-003"
type: "system_requirement"
name: "Interactive Architectural Grilling"
specification: "The system SHALL conduct an interactive, step-by-step interview to gather details on Domain-Driven Design (DDD), database schemas, architectural patterns, and security controls, asking 1-2 questions per turn."
derives_from:
  - "SCEN-001"
---

# SYSREQ-003: Interactive Architectural Grilling

## 1. Description
The assistant uses an interactive grilling flow to resolve design details one-by-one, ensuring that developers think through all critical architectural aspects of their feature.

## 2. Technical Details
- The interview must follow the `/grill-me` guidelines.
- The assistant asks questions sequentially, proposing recommended answers where appropriate.
- Topics covered must include:
  - **Bounded Contexts**: Mapping domain boundaries.
  - **Database Schemas**: Confirming table fields, primary/foreign keys, and normalization (3NF).
  - **C4 Component Layout**: Defining how containers, microservices, and databases communicate.
  - **Tactics & Security**: availability, performance (caching, index strategies), and threat modeling (STRIDE, OWASP).
