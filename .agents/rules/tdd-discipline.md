---
trigger: always_on
---

# Test-Driven Development (Red -> Green -> Refactor)

This is the highest-priority rule for ALL code changes. No exceptions.

1. **Red** — Write a failing test FIRST that proves the problem exists or specifies the new behavior. The test is a hypothesis. Do NOT touch production code yet.
2. **Green** — Write the minimum production code to make the test pass. The code is the conclusion.
3. **Refactor** — Improve the code while keeping tests green: simplify logic, reduce change surface, eliminate duplication, improve naming, remove dead code.

## Scientific method

Treat every test as an experiment:

- **Hypothesis** — the test describes expected behavior before code exists.
- **Experiment** — run the test; it MUST fail (red) to confirm the hypothesis is testable.
- **Conclusion** — production code makes it pass (green), proving the hypothesis.
- If a test passes before you write the code, it proves nothing — investigate why before continuing.

## State coverage

Line coverage is not the goal — **state coverage** is. Tests must cover all states a unit can receive:

- Valid inputs, invalid inputs, boundary values, empty/null/undefined states
- Error states, loading states, race conditions
- Use parameterized tests (Vitest `it.each`) to cover many input-output cases in a single block. Prefer them over copy-pasted test bodies.

## Test placement

- Unit tests live next to or near the code under test and run with Vitest.
- Never weaken an existing test to make a change pass. If a test blocks you, the test is telling you something — read it.
