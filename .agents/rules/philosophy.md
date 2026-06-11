---
trigger: always_on
---

# Working Philosophy

These rules apply to every task in this workspace:

1. **Follow every step** of any workflow you are executing, regardless of how simple the change appears. Even a one-line fix gets the full treatment. Do not skip or abbreviate steps.
2. **Tests are executable documentation** — someone reading only the test file must understand the feature.
3. **User checkpoints are mandatory.** When a workflow declares a checkpoint, present the decision to the user, ask, and wait for an explicit answer before continuing — even when operating autonomously.
4. **Stream full output** from test runs. Do not filter or truncate test output; the user wants to see real-time progress.
5. **Never commit, push, or comment on pull requests** unless the user explicitly asks.

## Parallelization

**Default: fan out.** Issue all independent tool calls together in a single step. Go sequential only when one call consumes the output of another.

Batch together: reading multiple files, running multiple searches with different terms, fetching multiple independent resources. Chain sequentially: fetch a resource, extract references from it, then fetch what it references.
