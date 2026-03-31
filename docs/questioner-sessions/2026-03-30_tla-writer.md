# Questioner Session — TLA+ Writer Agent

**Date:** 2026-03-30
**Status:** COMPLETE
**Dispatched to:** trainer

---

## Purpose
Internal quality gate that translates design requirements into formally verified TLA+ specifications, catching impossible states before implementation begins. Runs between requirements gathering and coding — not just a document generator, but a verifier that catches design flaws early.

## Artifact / Output Type
AGENT.md (internal only, not user-invokable). Lives at `.claude/skills/tla-writer/AGENT.md`.

## Trigger
Dispatched only by the questioner or the trainer. No direct user invocation.

## Inputs
Questioner session briefing file path + content. Single canonical input shape — trainer passes through the original briefing path. The briefing file follows the standard questioner session format (`docs/questioner-sessions/YYYY-MM-DD_<slug>.md`).

## Outputs
A versioned directory under `docs/tla-specs/<topic-slug>/` (or `<topic-slug>-v2/`, `<topic-slug>-v3/` if prior versions exist) containing:
- `.tla` spec file — the TLA+ specification covering all possible states
- `.cfg` TLC configuration file — model checking configuration
- `README.md` — links back to source briefing, summarizes verified states/properties, and lists TLC results

## Ecosystem Placement
Chained. Receives dispatches from questioner and trainer. Consults expert-tla as an advisory resource on failure. Writer owns the artifact, expert owns the knowledge. Expert-tla returns reasoning and suggestions; the writer applies them and re-runs TLC.

## Handoff
None. Verify and stop. Results presented to user with summary of states checked and properties verified. No downstream agent dispatch.

## Error States
Three tiers plus one environment tier:

1. **Syntax/parse errors** — self-fix without consulting anyone. Mechanical mistakes (missing operators, typos, wrong module names).
2. **Invariant/property violations** — TLC provides a counterexample trace. Up to 3 self-fix attempts, then escalate to expert-tla with the counterexample trace and reasoning about why fixes aren't working.
3. **Design ambiguity** — expert-tla can't resolve it (briefing is contradictory or underspecified). Escalate to user with a clear question about the design intent.
4. **Environment failures** — Java not found, jar path wrong, out of memory. Surface to user immediately as an environment issue.

## Name
`tla-writer`

## Scope
### In Scope
- Translating briefing requirements into TLA+ specifications
- Enumerating all possible states from the briefing
- Running TLC model checker via `C:\Users\glove\projects\tla-toolbox\tla2tools.jar`
- Self-fixing syntax and invariant errors (up to 3 attempts)
- Consulting expert-tla on unresolvable TLC failures
- Creating versioned output directories under `docs/tla-specs/`

### Out of Scope
- Generating implementation code from specs
- Modifying existing source code
- Dispatching downstream agents after verification
- Creating or modifying questioner sessions or briefings
- Running without a briefing file (no freeform mode)

## Edge Cases
- **Trivial systems (1-2 states):** Never treats a request as too trivial. Always produces a full spec with explicit state enumeration.
- **Incomplete briefings (`[INCOMPLETE]`):** Immediately notifies the user that the briefing is incomplete. Asks whether to continue (best-effort with explicit gaps noted) or stop.
- **Existing spec for same topic:** Creates a versioned directory (e.g., `order-workflow-v2/`) and notes the prior version in the README.

---

## Open Questions
None — all branches resolved.
