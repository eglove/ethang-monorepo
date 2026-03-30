# Artifact Guide

## Inference from Natural Language

| Signal in input | Artifact type | Location |
|---|---|---|
| "every time X happens", "automatically when", "on each edit" | Hook | `.claude/hooks/` |
| "I want to call /X", "a command for", "slash command" | Command | `.claude/skills/commands/` |
| "an expert in X", "a reviewer", "someone who does X when handed context" | Agent | `.claude/skills/agents/` |
| "coordinates", "moderates", "orchestrates", "collects opinions from", "debate" | Orchestrator | `.claude/skills/orchestrators/` |
| Multiple artifacts needed, or "a suite of" | Suite | subdirectory under appropriate parent |

When input is ambiguous, infer from the trigger: automated triggers → hook; user-initiated standalone → command; handed context from another agent → agent; fans out to multiple agents → orchestrator.

## Directory Placement Rules

| Artifact | Location | Naming pattern |
|---|---|---|
| Hook | `.claude/hooks/<name>.sh` | kebab-case verb phrase: `check-coverage.sh` |
| Command | `.claude/skills/<name>/SKILL.md` | kebab-case noun/action phrase: `peer-review/SKILL.md` |
| Internal agent | `.claude/skills/<name>/AGENT.md` | kebab-case role noun: `trainer/AGENT.md` |
| Orchestrator | `.claude/skills/orchestrators/<name>/SKILL.md` | kebab-case role noun: `debate-moderator/SKILL.md` |
| Suite | `.<parent>/<suite-name>/` with an `index.md` | kebab-case domain noun |

### SKILL.md vs AGENT.md

Use `SKILL.md` when the artifact is **user-invokable** — it will appear in the skills list and users can call it directly.

Use `AGENT.md` when the artifact is **internal only** — it is dispatched by `/questioner` or another agent, never called directly by users. It will be hidden from the skills list but is still discoverable by `/questioner`'s scan and readable by the Agent tool.

## Naming Conventions

Use kebab-case always. Names describe role or action, not implementation:

- **Agents:** role nouns — `sql-expert`, `peer-reviewer`, `security-auditor`
- **Orchestrators:** role phrases — `debate-moderator`, `project-planner`, `council-chair`
- **Commands:** action or noun phrases — `peer-review`, `analyze-schema`
- **Hooks:** verb phrases matching the trigger event — `check-coverage`, `validate-commit`

## Expert Council Pattern

When building a set of expert agents with an orchestrator:

```
.claude/skills/
  agents/
    peer-reviewer/SKILL.md      ← callable standalone as /peer-reviewer
    sql-expert/SKILL.md         ← callable standalone as /sql-expert
    security-auditor/SKILL.md
  orchestrators/
    debate-moderator/SKILL.md   ← fans out to experts, synthesizes, hands off
    project-planner/SKILL.md    ← receives synthesized output, plans next steps
```

Each agent MUST work standalone. The orchestrator composes them — it does not replace them.

## Handoff Interface Contract

When an artifact is part of a chain, define the handoff format explicitly in its SKILL.md:

- What it receives (input description)
- What it produces (output description)
- What the downstream consumer expects

Mismatched handoffs are the most common failure point in multi-agent chains. Define the contract before writing either side.
