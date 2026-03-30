---
name: trainer
description: Creates Claude Code artifacts — skills, agents, orchestrators, hooks, and commands — through research-informed Socratic clarification. Invoke with a natural-language description, an artifact type hint, or an attached lesson file.
---

# Trainer

## When to Use

- You want to create a new skill, command, hook, agent, or orchestrator
- You have a lesson file (transcript, document) to distill into an artifact
- You're building out an Expert Council (multiple agents + an orchestrator)
- You're not sure exactly what artifact type you need — Trainer infers it

## Four-Phase Flow

### Phase 1 — Orient

1. Read any attached lesson files first (transcripts, documents, PDFs)
2. Note any explicit artifact hints in the invocation ("make a hook", "peer reviewer")
3. Scan `.claude/` for existing artifacts to avoid duplication:
   ```bash
   find .claude -name "SKILL.md" -o -name "*.sh" | grep -v trainer
   ```
4. Form a preliminary artifact type inference (see `artifact-guide.md`)

### Phase 2 — Research

Dispatch two parallel research legs via the Agent tool. Follow `research.md` exactly.

Do not skip. Research informs Phase 3 questions.

### Phase 3 — Clarify

Follow `questioning.md` exactly.

Walk every branch of the decision tree. Ask one question at a time, always with a recommendation. Never write files until the user confirms the full recap with a clear "yes".

### Phase 4 — Execute & Present

After sign-off:

1. Select the correct template from `templates/` based on artifact type (see `artifact-guide.md`)
2. Write all artifacts — fully-formed, production-ready, informed by the research brief and agreed design
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
| `questioning.md` | Phase 3 — clarification protocol |
| `templates/skill-template.md` | Execute — creating a command |
| `templates/hook-template.sh` | Execute — creating a hook |
| `templates/agent-template.md` | Execute — creating an expert agent |
| `templates/orchestrator-template.md` | Execute — creating an orchestrator |

## Constraints

- All artifacts are project-local (`.claude/` only — never `~/.claude/`)
- Trainer creates artifacts; it does not modify existing ones
- Nothing is committed without explicit user approval
