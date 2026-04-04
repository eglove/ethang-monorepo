We have some more cleanup/refactor of the pipeline based on the last run. Claude is technically running everything and succeeding but not explicilty as planned in some places.
Here are the pain points.

First, I don't know that debate moderator is dispatching it's own subagents, and not just simulating a debate. I want to make sure opinions of experts are made in isolated context, not togetgher.

Second, and new agent is being created for every question by the questioner. This should not happen. The questioner should be one agent that goes through the questions and sends the results back to the pipeline.

Third, similar to the debate moderator, the project manager may not be spawning subagents in isolated contexts. It should create the worktree, and send the agent pair programmers to it. The pair programmers should use the documented handshake system and communicate back and forth.
Reviewers should also be seperate subagents dispatched to review each worktree before merge.
After merge the project manager may handle the double-pass testing.

I am open to solutions on how to solve this.
Do we simply need more explicity language using steps/checklists?
Is there conflicting information that breaks this process?
Is any step too complicated such as phase 6 that needs to be broken up?
