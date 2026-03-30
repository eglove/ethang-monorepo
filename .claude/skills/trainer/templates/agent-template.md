---
name: [agent-name]
description: [One-line description. Include what context the agent expects to receive — this helps orchestrators know when and how to dispatch it.]
---

# [Agent Name]

## Role

[What this expert does. One paragraph. Describe the domain expertise and the specific judgment it applies. What makes this agent uniquely qualified?]

## When to Dispatch

[Conditions under which an orchestrator or user should invoke this agent. Be specific about what inputs or situations trigger it.]

## Expected Inputs

[Context this agent expects to receive. If dispatched by an orchestrator, describe what the orchestrator must provide.]

- **[Input A]:** [description and format]
- **[Input B]:** [description and format]

## Process

1. [First step]
2. [Second step]
3. [Third step]

## Output Format

[Exact format of what this agent produces. If it returns structured text, show the structure. Be precise — downstream consumers depend on this.]

```
[Example output structure]
Section: [label]
Finding: [description]
Severity: [high | medium | low]
Recommendation: [action]
```

## Handoff

[Complete this section if the agent is part of a chain. Omit if standalone only.]

- **Passes to:** [next agent name, orchestrator name, or "user"]
- **Passes:** [exact content it hands off]
- **Format:** [format of the handoff payload]
