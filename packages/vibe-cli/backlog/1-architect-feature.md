First, rebasing is explicitly disallowed from the vibe-cli pipeline. This is a hard rule not open for debate.
We prefer merge, squash, and merge-queues.
Currently, the vibe-cli pipeline has rebase logic that needs to be replaced.

---

I want to write an architecture writer that focuses on designing the high-level architecture
for code. It should generally make decisions on the context of the prompt but the one thing
it should have strong preference for is using @ethang/store for event-driven OOP. But it
should not have a bias towards OOP broadly, small pure functions are easy to test and memoize, for example.

The architecture writer will go through a similar debate loop to current doc writers,
get the feature directory for context, and its primary output will be plantuml diagrams saved a .puml
This can be a single diagram or multiple depending on the size/complexity.

The architecture stage should happen after BDD is complete and before TLA+.

The debate moderataor should continue to read the entire feature directory for context
but debate specifically over the architecture directory.

---

As a part of this feature two new experts should be created and added to the debate pool:
- event-driven expert
- signal-graph expert

Both of these experts are good choices for designing state handling and
transitions in a clean way.
