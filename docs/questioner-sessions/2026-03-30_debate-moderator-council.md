# Questioner Session — Debate Moderator Expert Council

**Date:** 2026-03-30
**Status:** COMPLETE
**Dispatched to:** trainer

---

## Purpose

A council of domain experts that debates a topic until consensus is reached, producing a synthesis document for the caller to act on. The moderator facilitates only — it does not form opinions, edit files, or cast a deciding vote.

## Artifact / Output Type

Expert Council — 1 orchestrator (`debate-moderator`) + 8 expert agents. All artifacts use `SKILL.md` (user-invokable as slash commands and agent-dispatchable by other orchestrators).

## Trigger

- User invokes `/debate-moderator <topic>` with optional expert selection and context
- An agent dispatches the moderator programmatically with the same interface
- Individual experts can also be invoked directly (e.g., `/expert-tdd <question>`)

## Inputs

All agents (moderator and experts) receive the same input shape:
- **Topic:** The idea, question, code snippet, or artifact being evaluated (free text or code)
- **Context:** Optional background (e.g., "this is for a React server component in a monorepo")
- **Experts:** (Moderator only) Optional list of which experts to include in the debate. If omitted, the moderator lists available experts and halts — it does not proceed without an explicit selection.

## Outputs

**Per debate round (each expert):**
- `Position` — their stance on the topic from their domain lens
- `Reasoning` — why, from their area of expertise
- `Objections` — specific concerns raised
- `Endorsements` — which other experts' points they agree with

**Final moderator output:**
- Agreed-upon recommendation (synthesized from expert consensus)
- Each expert's final position
- Any unresolved dissenting notes (if partial consensus)
- Round count
- Path to saved session document

## Ecosystem Placement

Both standalone and chainable. Each artifact works independently; the moderator also composes all experts into a single debate flow.

## Handoff

- Saves synthesis to `docs/debate-moderator-sessions/YYYY-MM-DD_<topic-slug>.md`
- Returns synthesis content + file path to the caller (user or agent)
- Caller decides what to do with the result — moderator does not dispatch further

## Error States

- **Stalemate (no new objections after round N but consensus not reached):** Cap at 5 rounds. Save as `[PARTIAL CONSENSUS]` noting which experts agreed, which objections remain unresolved. Return to caller to decide next steps.
- **Expert failure (no output or error):** Skip the failed expert for that round, note the gap in synthesis, continue debate. Do not halt the whole debate.

## Name

- Orchestrator: `debate-moderator`
- Experts:
  - `expert-tdd`
  - `expert-ddd`
  - `expert-bdd`
  - `expert-atomic-design`
  - `expert-tla`
  - `expert-performance`
  - `expert-edge-cases`
  - `expert-continuous-delivery`

## Scope

- **Advisory only** — no file edits, no code changes, no moderator opinions
- **No topic is out of scope** — experts engage from their domain angle regardless of whether the topic is directly within their expertise
- **Expert selection is mandatory** — moderator will not start a debate without knowing which experts to include

## Edge Cases

- Topic completely outside all experts' domains: experts still respond from their angle
- Single expert selected: debate proceeds as a solo review (no cross-expert objections possible)
- All experts selected but one fails: debate continues with remaining experts, failure noted
- Stalemate at round 5: emit `[PARTIAL CONSENSUS]` document, return to caller

---

## Shared Values (Applied to All Experts)

All expert agents share these values and apply them when forming positions:

1. **Respect for each other's expertise** — acknowledge and engage with other experts' domain knowledge rather than dismissing it
2. **Simple, readable, easy-to-maintain code** — prefer clarity over cleverness; complexity must justify itself
3. **Strict TypeScript, ESLint, and similar tooling** — enforce type safety and linting rules without compromise; no suppressions without explicit justification

---

## Open Questions

None.
