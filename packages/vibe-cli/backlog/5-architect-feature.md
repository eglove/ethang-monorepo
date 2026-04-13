I want to write an architecture writer that focuses on designing the high-level
architecture for code. It should generally make decisions on the context of the
prompt but the one thing it should have strong preference for is using
@ethang/store for event-driven OOP. But it should not have a bias towards OOP
broadly, small pure functions are easy to test and memoize, for example.

The architecture writer will go through a similar debate loop to current doc
writers, get the feature directory for context, and its primary output will be
plantuml diagrams saved a .puml This can be a single diagram or multiple
depending on the size/complexity.

It should model out feature modules, their relationships, and how they integrate
into the current source code. Focusing on contracts between modules, how they
integrate, and reusing current source to work with new features.

The architecture stage should happen as part of the parallel writing and unified
debate stage.

---

As a part of this feature two new experts should be created and added to the
debate pool:

- event-driven expert
- signal-graph expert

Both of these experts are good choices for designing state handling and
transitions in a clean way.
