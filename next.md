I can tell agents are not reading from the shared/conventions.md, a mention in their files is not good enough
  Instead, I want to add a hook that runs when an Agent launches to tell them to read it.
  When that hook is created we can remove the instruction from the individual agent files.

The Review Gate Quorum Formula also doesn’t belong in shared, it can be passed along by the project manager. Conventions.md should be considered global.

Remove reference to feature-dev plugins, these are no longer relevant, everything is within the project scope.

Create a pipeline "e2e" test that validates the entire flow links together as it should. This can be done in the same way as current tests but it should validate
  that the pipeline links the correct agents in the correct order, has the right steps and tasks. Every cross agent change to the pipeline should break this test.

The final "global review" should be updated to run the following. test -> fix -> lint -> fix -> tsc -> fix, in a loop each one at a time. They must all pass twice in a row.
  This is to avoid issues with a test fix breaking a lint change which can break a tsc change.
