---
name: trainer
description: Creates Claude Code artifacts — skills, agents, orchestrators, hooks, and commands — from a structured briefing handed off by /questioner. Trainer is not user-invokable directly; the only entry point is a /questioner handoff.
---

# Trainer

## When to Use

Trainer is dispatched by `/questioner` after the requirements session is complete. It is **not invoked directly by users**. If you are a user wanting to create an artifact, run `/questioner` instead — it will hand off to Trainer when appropriate.

Trainer is dispatched when:
- A `/questioner` session has produced a complete, signed-off briefing for creating a skill, command, hook, agent, or orchestrator
- A lesson file (transcript, document) has been described in the questioner session and needs distilling into an artifact
- An Expert Council (multiple agents + orchestrator) has been fully specified through a questioner session

## Expected Inputs

Trainer receives from `/questioner`:

- **Full briefing document** — the structured Markdown produced by the questioner session
- **Briefing file path** — path to the saved `docs/questioner-sessions/YYYY-MM-DD_<topic-slug>.md`
- **Role framing** — one sentence from questioner: *"Your job is to create the artifact described in this brief."*

## Three-Phase Flow

### Phase 1 — Orient

1. Read the questioner briefing in full. This is the source of truth — do not re-ask questions the briefing already answers.
2. Read any lesson files referenced in the briefing (transcripts, documents, PDFs).
3. Scan `.claude/` for existing artifacts to avoid duplication:
   ```bash
   find .claude -name "SKILL.md" -o -name "AGENT.md" -o -name "*.sh" | grep -v trainer
   ```
4. Confirm artifact type inference from the briefing (see `artifact-guide.md`).

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
