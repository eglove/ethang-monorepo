# Bounded Context Map — vibe-cli Bus

Formal DDD context map for the bidirectional communication subsystem.

---

## Upstream/Downstream

Four bounded contexts participate in the event bus. Upstream contexts publish events
that downstream contexts consume. The relationship direction follows event flow:

```text context-map
Verification ──────────────────────────────┐
                                           │ verify_result
ProtocolError ─────────────────────────────┤
                                           │ protocol_error
Consensus ─────────────────────────────────┤
                                           │ consensus_ratified / consensus_failed
                                           ▼
                                   AgentLifecycle
```

**Upstream contexts:** Consensus, Verification, ProtocolError
**Downstream context:** AgentLifecycle

**Bidirectional relationship (Customer-Supplier):**
AgentLifecycle publishes `done` events that trigger Consensus processing. This
upstream kickoff is mediated by the Router (orchestration layer) rather than a
direct bounded-context contract, preserving the acyclic contract graph.

### Context Summaries

**AgentLifecycle**
Manages the full lifecycle of pipeline agents: bootstrap, ground-truth delivery,
checkpoint/restore, and terminal `done` events. Subscribes to results from all
other contexts.

**Consensus**
Governs multi-agent agreement: objection raising and resolution, consensus
candidates, ratification, and failure. Customer-Supplier with AgentLifecycle —
Consensus is the upstream supplier of agreement outcomes.

**Verification**
Handles code and artifact verification: verify requests, verify results, review
requests, and review verdicts. Conformist to AgentLifecycle — it adapts its
output to what AgentLifecycle requires.

**ProtocolError**
Captures and acknowledges protocol-level violations that cannot be handled by
domain logic. Publishes errors to AgentLifecycle for remediation.

---

## ACL Boundaries

Anti-Corruption Layers isolate downstream contexts from upstream model changes.

### HandlerAdapter (Verification → AgentLifecycle)

`HandlerAdapter` is the Anti-Corruption Layer between the Verification context
and AgentLifecycle. It translates `verify_result` and `review_verdict` events
from Verification's domain model into AgentLifecycle's internal representation.

- Verification speaks in terms of `VerificationOutcome` and `ReviewVerdict`
- AgentLifecycle speaks in terms of `HandlerState` and `HandlerPendingEvent`
- `HandlerAdapter` translates between the two without leaking Verification
  concepts into AgentLifecycle's domain model

### ProtocolError as Conformist

ProtocolError is a **Conformist** — it publishes errors in the exact schema that
AgentLifecycle expects, with no translation layer. AgentLifecycle's event schema
is the shared kernel that ProtocolError must conform to.

---

## Integration Patterns

### Customer-Supplier: AgentLifecycle ↔ Consensus

**Relationship:** Consensus (upstream Supplier) → AgentLifecycle (downstream Customer)

Consensus drives agreement outcomes that AgentLifecycle must act on:

- `consensus_ratified` → AgentLifecycle advances the pipeline
- `consensus_failed` → AgentLifecycle halts or retries

AgentLifecycle triggers Consensus by emitting `done` events, making this a
bidirectional Customer-Supplier. The Router mediates the AgentLifecycle→Consensus
direction to avoid a direct context dependency cycle.

**Negotiation:** AgentLifecycle team (Customer) negotiates with Consensus team
(Supplier) on event schemas and SLA contracts. Changes to consensus event
structure require Customer approval.

### Conformist: AgentLifecycle → Verification

**Relationship:** Verification (upstream) → AgentLifecycle (downstream, Conformist)

AgentLifecycle conforms to Verification's published interface without negotiation.
It adapts internally via `HandlerAdapter` (ACL) rather than asking Verification to
change its model.

**Rationale:** Verification is a reusable context that may serve multiple
downstream consumers. Conformist pattern keeps Verification decoupled.

### Published Language: ProtocolError

ProtocolError uses a Published Language — a well-documented, stable event schema
(`protocol_error` / `protocol_error_ack`) that all contexts can consume without
translation. This schema is versioned and backward-compatible.
