This will be a massive rewrite and simplification of stage 8 coding. By allowing
Claude to do what it is already good at. Most of the current logic will be
deleted. The current complexity is causing more issue than it's worth. So
disregard everything Stage 8 does right now and think in terms of a clean slate.

Claude already understands implementation plans pretty well we can simply give
it reference to the feature docs and tell it to create parallel agents per tier
in the implementation-plan.json following TDD. It can reliably handle this
work without Powershell managing it.

We can use powershell to enforce that all test fixtures are covered by tests as
well.

This removes the idea of having specific language experts, the parallel agents
can infer what they need to infer.

Before stage 8 continues, we need to prompt the user to confirm that they want
to commit all uncommited changes, then handle it on yes. As claude will not use
worktrees if it has them. So this is logic we can add at the start of stage 8.

Within the prompt to tell claude to implement the implementation plan, we can
specify not to automatically merge anything when finished.

Then in parallel, with powershell run pnpm test -> pnpm lint with the
double-pass logic.

Double-pass logic means test -> lint needs to pass twice before moving on. test
fixes can break lint and lint fixes and break tests.

Note that I have added test and lint script to a package.json file in vibe-cli
even though it has no node_modules. This allows running pnpm scripts as all
other projects do.

After each worktree gets a double-pass, we send reviewer agents in parallel to
look, get their results in a consolidated report and determine if mork work is
needed.

If so, this simply goes as a generic task to claude (no particular agent) to fix
with TDD. (All changes should have tests).

Then we merge in taks order, and do another global review. test -> lint
double-pass, and reviewer agents to look.

So here are how responsibilities look.

| Powershell                                                                                   | Claude                                                                      |
|----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| Ask user if they want to commit all changes, and commit                                      |                                                                             |
|                                                                                              | Implement implentation-plan.md                                              |
|                                                                                              | Dispatch parallel agents in worktrees according to implementation-plan.json |
|                                                                                              | Write tests based on fixtures generated during BDD and TLA+ writer stages   |
| Check if tests were written with 100% coverage of fixtures                                   |                                                                             |
| Run lint -> test double-pass check on each worktree before merge                             |                                                                             |
|                                                                                              | Receive lint and test errors to fix                                         |
| Dispatch reviewer agents in parallel and consolidate report with pass/fail for each worktree |                                                                             |
|                                                                                              | Receive reviewer feedback and make changes                                  |
| Merge, delete and cleanup worktrees in order in implenetation-plan.json                      |                                                                             |
| Run lint -> test double-pass check on feature branch                                         |                                                                             |
|                                                                                              | Receive lint and test errors to fix                                         |
| Dispatch reviewer agents in parallel and consolidate with pass/fail on feature branch        |                                                                             |
|                                                                                              | Receive reveiwer feedback and make changes                                  |

