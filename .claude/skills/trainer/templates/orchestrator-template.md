name: [orchestrator-name]
description: [One-line description. Include what it coordinates, what experts it uses, and what it produces.]
---

# [Orchestrator Name]

## Role

[What this orchestrator coordinates. One paragraph. Describe the synthesis or arbitration it performs and why a single agent couldn't do it alone.]

## Expert Roster

Dispatched in parallel via the Agent tool:

| Agent | Skill path | Contribution |
|---|---|---|
| [agent-name] | `.claude/skills/agents/[agent-name]/SKILL.md` | [what it contributes to the synthesis] |
| [agent-name] | `.claude/skills/agents/[agent-name]/SKILL.md` | [what it contributes to the synthesis] |

## Fan-Out Protocol

1. Receive input context
2. Dispatch all agents in parallel via the Agent tool, passing each the full input context plus any agent-specific framing
3. Wait for all outputs before proceeding to synthesis

## Synthesis Step

[How the orchestrator synthesizes or arbitrates between expert outputs:]

- **Conflicts:** [how disagreements between experts are resolved]
- **Consensus:** [how agreement is recognized and recorded]
- **Gaps:** [what to do if an expert produced no output or an error]

## Output Format

[What the orchestrator produces after synthesis. Be explicit — the downstream consumer depends on this structure.]

```
[Example synthesized output structure]
```

## Handoff

- **Passes to:** [next orchestrator, agent name, or "user"]
- **Passes:** [synthesized output description]
- **Format:** [format of the handoff payload]
