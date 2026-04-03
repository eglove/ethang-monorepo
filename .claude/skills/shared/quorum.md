---
name: quorum-formula
description: Defines the review gate quorum formula ceil(2n/3) with floor guard. Owned by the review gate. Referenced by the design-pipeline orchestrator and all reviewers.
---

# Quorum Formula

## Definition

The review gate quorum is computed as:

```
quorum(n) = ceil(2n / 3)
```

Where `n` is the number of non-UNAVAILABLE reviewers that responded.

## Precondition (Floor Guard)

`n >= 1`. If `n < 1`, the quorum function is undefined and the review gate cannot produce a valid verdict. This is a hard error -- the gate must halt.

## Documented Behaviors

| n | quorum(n) | Notes |
|---|-----------|-------|
| 1 | 1 | Single reviewer must pass |
| 2 | 2 | **Unanimity required** -- intentional per amendment 8. At n=2, ceil(4/3) = 2. Both reviewers must agree. |
| 3 | 2 | Two-thirds majority |
| 8 | 6 | Current roster (8 reviewers minus UNAVAILABLE) |
| 9 | 6 | Future roster (9 reviewers with a11y-reviewer) |

## Ownership

This formula is owned by the review gate specification. The design-pipeline orchestrator and project-manager reference it when evaluating reviewer verdicts. Individual reviewers do not need to know the formula -- they simply return their verdict.

## Companion Implementation

A reference TypeScript implementation exists at `docs/tla-specs/plantuml-questioner-librarian-a11y/quorum.ts` for testing purposes. This is not production runtime code.

## TLA+ Coverage

- Helper: `Quorum(n)` in the TLA+ specification
- Invariant: `QuorumFloorGuard` -- when n >= 1, quorum >= 1 (no vacuous gate passage)
- Invariant: `QuorumAtTwoIsUnanimity` -- at n=2, quorum=2
