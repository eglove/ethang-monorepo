Questioner: Does this look right? Any changes to the expert list or design decisions before I launch the debate?
User: remember, the questioner no longer choose and confirms the expert council, is this still in your instructions? It's handled by the debate moderator,     
confirm that's the case

Questioner: Good catch — let me verify both files to confirm the current state.

Questioner: Confirmed — the code is already correct:

- Questioner (SKILL.md line 8): explicitly states it handles branches 1–10 only and "does not curate the expert council — that responsibility belongs to
  downstream pipeline stages."
- Debate-moderator (SKILL.md): has the Autonomous Expert Selection section with selectExperts(topic) — it picks experts autonomously when no --experts
  argument is provided.

The bug is in the design-pipeline SKILL.md — my orchestrator instructions. Let me check:

Questioner: Yes — the design-pipeline SKILL.md is stale. It still tells the questioner to include an "Expert Council" section and passes the expert list from Stage 1
to Stages 2 and 4. This contradicts what PR #40 already shipped:

- The questioner no longer does expert selection (Branch 11 removed)
- The debate-moderator now autonomously selects experts via selectExperts(topic)

This is exactly the kind of cross-agent state that a global state file would help with — but first, the SKILL.md needs updating.

Should I add "fix the stale expert-selection references in design-pipeline SKILL.md" as part of this pipeline run's scope, or handle it as a separate
fix?

User: Add the fix as a part of the pipeline run scope