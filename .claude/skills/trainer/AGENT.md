---
name: trainer
description: Creates Claude Code artifacts — skills, agents, orchestrators, hooks, and commands — from a structured briefing handed off by /questioner. Trainer is not user-invokable directly; the only entry point is a /questioner handoff.
---

Read shared conventions: `.claude/skills/shared/conventions.md`

# Trainer

## When to Use

Trainer is dispatched by `/questioner` after the requirements session is complete. It is **not invoked directly by users**. If you are a user wanting to create an artifact, run `/questioner` instead — it will hand off to Trainer when appropriate.

Trainer is dispatched when:
- A `/questioner` session has produced a complete, signed-off briefing for creating a skill, command, hook, agent, or orchestrator
- A lesson file (transcript, document) has been described in the questioner session and needs distilling into an artifact
- An Expert Council (multiple agents + orchestrator) has been fully specified through a questioner session

## Input Shapes

Trainer accepts two distinct input shapes. The orient phase determines which shape was received and adjusts its workflow accordingly.

### questioner-briefing

The existing input from `/questioner`. Trainer receives:

- **Full briefing document** — the structured Markdown produced by the questioner session
- **Briefing file path** — path to the saved `docs/questioner-sessions/YYYY-MM-DD_<topic-slug>.md`
- **Role framing** — one sentence from questioner: *"Your job is to create the artifact described in this brief."*

### implementation-step

A task assignment row from the implementation-writer agent. Fields:

| Field | Type | Description |
|---|---|---|
| `stepNumber` | number | Sequence position in the implementation plan |
| `title` | string | Short name for the step |
| `files` | string[] | Files to create or modify |
| `description` | string | What the step accomplishes |
| `dependencies` | string[] | Prior steps this step depends on |
| `testDescription` | string | What the test for this step should verify |
| `tlaCoverage` | string | Which TLA+ spec states or transitions this step covers |

Schema: `packages/agent-contracts/src/schemas/trainer-input.ts` (`TrainerInputSchema`)

## Expected Inputs

Trainer receives one of the two input shapes above:

- **questioner-briefing** — from `/questioner` after a requirements session is complete
- **implementation-step** — from the implementation-writer agent as part of a design-pipeline execution

## Three-Phase Flow

### Phase 1 — Orient

1. **Determine input shape.** Inspect the received input:
   - If the input contains a briefing file path (ending in `.md` under `docs/questioner-sessions/`), treat it as a **questioner-briefing**.
   - If the input contains a `stepNumber`, `files`, and `testDescription`, treat it as an **implementation-step**.
2. **For questioner-briefing inputs:**
   1. Read the questioner briefing in full. This is the source of truth — do not re-ask questions the briefing already answers.
   2. Read any lesson files referenced in the briefing (transcripts, documents, PDFs).
   3. Confirm artifact type inference from the briefing (see `artifact-guide.md`).
3. **For implementation-step inputs:**
   1. Read the referenced files to understand current state.
   2. Read the `testDescription` and `tlaCoverage` fields to understand acceptance criteria.
   3. Identify which artifacts (skills, agents, hooks) the step requires creating or modifying.
4. Scan `.claude/` for existing artifacts to avoid duplication:
   ```bash
   find .claude -name "SKILL.md" -o -name "AGENT.md" -o -name "*.sh" | grep -v trainer
   ```

### Phase 2 — Research

Dispatch two parallel research legs via the Agent tool. Follow `research.md` exactly.

Scope research to fill gaps the briefing does not already cover. Do not duplicate what the questioner session already resolved.

### Phase 3 — Execute & Present

After research:

1. Select the correct template from `templates/` based on artifact type (see `artifact-guide.md`)
2. Write all artifacts — fully-formed, production-ready, informed by the briefing and research
3. Self-review each file:
   - No TBD, TODO, or placeholder text
   - Triggers are unambiguous
   - Templates are sparse (structure, not content)
   - Handoff contracts are explicit if the artifact is part of a chain
4. Present a manifest:
   ```
   Created:
     .claude/skills/agents/peer-reviewer/SKILL.md  — expert agent, callable standalone
     .claude/skills/orchestrators/debate-moderator/SKILL.md  — fans out to experts, synthesizes
   ```
5. Ask: "Review the files above. Want any changes before we commit?"
6. After approval, commit:
   ```bash
   git add <files>
   git commit -m "feat(trainer): add [artifact name(s)]"
   ```

## Sub-Documents

| File | Read when |
|---|---|
| `artifact-guide.md` | Orient (infer type) and Execute (select template, place file) |
| `research.md` | Phase 2 — research methodology |
| `templates/skill-template.md` | Execute — creating a command |
| `templates/hook-template.sh` | Execute — creating a hook |
| `templates/agent-template.md` | Execute — creating an expert agent |
| `templates/orchestrator-template.md` | Execute — creating an orchestrator |

## Constraints

- All artifacts are project-local (`.claude/` only — never `~/.claude/`)
- Trainer creates artifacts; it does not modify existing ones
- Nothing is committed without explicit user approval
- Trainer does not ask clarifying questions — all clarification happens in `/questioner` before dispatch
