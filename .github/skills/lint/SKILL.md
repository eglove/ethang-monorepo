---
description: ALWAYS invoke this skill for any linting tasks. Do not run eslint directly. Specifically designed to understand and fix issues with @ethang/eslint-config. Aware of rules, tracks fix attempts, asks for help after 3 failures.
name: lint
---

# ESLint Fixer and Config Manager

This skill is designed specifically to understand, execute, and fix issues related to the `@ethang/eslint-config` package and the broader monorepo linting environment.

## Context & Awareness

1. **Rule Awareness**: You must be aware of every rule turned on or off in the configuration.
- Use the `grep` tool to inspect `packages/eslint-config/src/config.*.js` dynamically to parse and understand the rules currently applied.
1. **Knowledge Base**: Check the skill resources for difficult rules and their solutions before attempting to fix them.

## Execution Workflow

When this skill is invoked, follow these steps:

1. **Run ESLint**: Execute the linter across the affected project or monorepo to identify issues. Use `pnpm lint` as appropriate for the target workspace.
1. **Fix Issues**: Modify code to resolve the linting errors identified.
1. **Turn Tracking**: You must track how many times you have attempted to fix a specific rule across separate invocations.
- If it takes more than 3 separate invocations (turns) to fix a specific linting rule, you MUST STOP and ask the user for guidance. Explain what you've tried and ask how they want to proceed.

## Best Practices

* Always verify the linter runs cleanly after applying fixes.
* For configuration issues, cross-reference the problem with the rules defined in `packages/eslint-config/src/config.*.js`.
* Keep the knowledge base concise and structured (Rule Name, Problem, Solution/Workaround).
