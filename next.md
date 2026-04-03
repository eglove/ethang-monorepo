1. design-pipeline and implementation-writer need to be updated to use the project-manager. This was created by never wired up. This also means updating the state document and any other relevant claude artifacts.
2. Introduce the idea of "reviewers", that review the work of writers and send back for revision when needed. I am open to any types of reviewers that the council may want to suggest in addition to:
   1. Claude artifact reviewer (skills, agents, commands, hooks)
   2. Compliance reviewer (according to upstream pipeline specs)
   3. Bug reviewer (potential code bugs, loook at code, comments, git history, and pr's of files to see if anything new introduced bugs)
   4. Simplicity reviewer (focuses on keeping things simple, reduce unnecessary complexity, elimintae redunant code and abstractions, improve readability, consolidate related logic, remove unecessary comments, clarity over brevity)
   5. Type-design reviewer (review invariant strength, encapsulation quality, practical usefulness)
   6. Security reviewer
   7. Backlog reviewer (identify anything that could potentially be a future feature or fix but is not important for this pipeline)
3. Currently there are multiple agents allowed to add suggestions to user_notes. I want all agents to be able to do this at any time and it be much more free form. The user will audit everything in it. But if any agent calls out or notices something that is not important but might be worth exploring, adding, modifying, etc. in the future add a note to user_notes.
