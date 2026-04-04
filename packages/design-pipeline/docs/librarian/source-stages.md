# Source -- Stages

| Path | Kind | Summary | Updated |
|------|------|---------|---------|
| src/stages/base-coordinator.ts | base | Base stage coordinator; shared `executeWithValidation` helper with retry and Zod validation | 2026-04-03 |
| src/stages/questioner.ts | stage-1 | Questioner coordinator; elicits requirements via multi-turn conversation | 2026-04-03 |
| src/stages/debate-moderator.ts | stage-2 | Debate moderator coordinator; runs expert debate and produces synthesis | 2026-04-03 |
| src/stages/tla-writer.ts | stage-3 | TLA+ writer coordinator; generates formal TLA+ specification from debate synthesis | 2026-04-03 |
| src/stages/expert-review.ts | stage-4 | Expert review coordinator; dispatches to domain reviewers and collects verdicts | 2026-04-03 |
| src/stages/implementation-planning.ts | stage-5 | Implementation planning coordinator; produces step-by-step implementation plan | 2026-04-03 |
| src/stages/pair-programming.ts | stage-6 | Pair programming coordinator; autonomous code writing with git commits | 2026-04-03 |
| src/stages/fork-join.ts | stage-7 | Fork-join coordinator; parallel PlantUML + librarian + final commit | 2026-04-03 |
