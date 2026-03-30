# Trainer — Design Spec
**Date:** 2026-03-30
**Status:** Approved

---

## Overview

Trainer is a slash command (`/trainer`) that creates Claude Code artifacts — skills, commands, hooks, agents, and orchestrators — for the `ethang-monorepo` project. It operates as a meta-agent: its output is other agents.

Trainer works by deeply clarifying what is needed (through relentless Socratic questioning), researching the subject matter and existing similar skills, then autonomously writing production-ready artifacts and seeking approval before committing.

---

## Scope

All artifacts are scoped to `ethang-monorepo/.claude/`. Nothing is written to user-global `~/.claude/`.

---

## Directory Layout

```
.claude/
  hooks/                        ← automated PostToolUse / PreToolUse triggers
  skills/
    trainer/                    ← Trainer itself (this system)
      SKILL.md
      research.md
      questioning.md
      artifact-guide.md
      templates/
        skill-template.md
        hook-template.sh
        agent-template.md
        orchestrator-template.md
    agents/                     ← expert subagents (e.g., peer-reviewer, sql-expert)
    orchestrators/              ← debate moderators, project planners, synthesizers
    commands/                   ← standalone slash commands
```

---

## Four-Phase Flow

### Phase 1 — Orient
- Read any attached lesson files (transcripts, documents) first
- Note any explicit hints in the invocation (e.g., "make a hook", "peer reviewer")
- Scan `.claude/` for existing artifacts to avoid duplication
- Identify the most likely artifact type(s) from initial context

### Phase 2 — Research
Two parallel legs run simultaneously via the Agent tool:

**Leg A — Subject Matter Research**
WebSearch + WebFetch to find: official documentation, best practices, anti-patterns, real-world examples of the concept being automated.

**Leg B — Existing Skill Research**
Search GitHub for community SKILL.md files on the topic. Check locally cached plugins in `~/.claude/plugins/cache/` for structurally similar skills. Extract: naming conventions, trigger conditions, checklist patterns, sub-document organization.

**Lesson files:** Processed before web research. Research legs fill *gaps* in the lesson rather than duplicating it.

**Output:** An internal research brief (available on request) summarizing findings and informing the Clarify phase.

### Phase 3 — Clarify
Relentless Socratic questioning until full shared understanding:

1. **Map the full decision tree** — internally enumerate every branch before asking anything: purpose, trigger, inputs, outputs, error states, ecosystem placement, naming, scope, edge cases, handoff format
2. **Walk branches in dependency order** — resolve upstream decisions before downstream ones
3. **One question per message, always with a recommendation** — "I'd go with X because Y — does that match your intent?" User can confirm quickly or redirect
4. **Never close a branch early** — if a question reveals a sub-branch, walk all the way down it before moving on
5. **Explicit sign-off gate** — recap the full agreed design, require a clear "yes" before executing

### Phase 4 — Execute & Present
1. Write all artifacts — fully-formed, production-ready, informed by research and agreed design
2. Self-review against `writing-skills` best practices: concise, unambiguous triggers, sparse templates
3. Present a manifest of what was created with a one-line description of each artifact
4. Approval gate — ask for review before committing
5. Commit with a descriptive message once approved

---

## Artifact Taxonomy

Defined in `artifact-guide.md`. Trainer infers the artifact type from natural language:

| Signal | Artifact | Location |
|---|---|---|
| "every time X happens automatically" | Hook (shell script) | `.claude/hooks/` |
| "I want to call /something" | Command (SKILL.md) | `.claude/skills/commands/` |
| "an expert that does X when handed context" | Agent (SKILL.md) | `.claude/skills/agents/` |
| "coordinator / moderator / orchestrator" | Orchestrator (SKILL.md) | `.claude/skills/orchestrators/` |
| Multiple artifacts needed | Suite (subdirectory with index) | appropriate parent |

**Expert Council pattern:** Multiple expert agents under `.claude/skills/agents/`, debate moderator / synthesizer under `.claude/skills/orchestrators/`, with each expert also usable standalone as a slash command.

---

## Sub-Document Roles

| File | Purpose |
|---|---|
| `SKILL.md` | Entry point, four-phase orchestrator, thin — delegates to sub-docs |
| `research.md` | Methodology for parallel research legs, synthesis rules, lesson-file handling |
| `questioning.md` | Decision-tree mapping, branch-walking discipline, recommendation-first protocol |
| `artifact-guide.md` | Taxonomy, directory placement rules, naming conventions |
| `templates/skill-template.md` | SKILL.md scaffold: frontmatter, triggers, checklist, decision tables |
| `templates/hook-template.sh` | Bash hook with `hookSpecificOutput` JSON pattern |
| `templates/agent-template.md` | Subagent SKILL.md: role, inputs, outputs, handoff format |
| `templates/orchestrator-template.md` | Orchestrator SKILL.md: fan-out, debate/synthesis step, handoff chain |

---

## Key Design Principles

- **Inference-first** — Trainer infers artifact type and structure from natural language; explicit overrides always accepted
- **Recommendation-first questioning** — every clarifying question comes with Trainer's recommended answer, shifting cognitive load to Trainer
- **Research-informed, not generic** — questions are shaped by what research found, not boilerplate
- **No execution without agreement** — Phase 3 always ends with explicit sign-off; nothing is written until then
- **No commit without approval** — artifacts are presented for review before any git commit

---

## Out of Scope

- Writing to user-global `~/.claude/` (all artifacts are project-local)
- Publishing skills to marketplaces
- Modifying existing artifacts (Trainer creates; editing existing artifacts is manual or a future extension)
