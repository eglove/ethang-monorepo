import { defineSkill } from "../../define.ts";

export const eslintFixerSkill = defineSkill({
  content: `# ESLint Fixer & Quality Guidelines

This skill enforces monorepo-wide eslint resolution patterns and maps linter rules to resolve conflicts and maintain code quality.

## Style/Quality Guidelines

- **Yoda comparisons**: Always put the constant first in comparisons (e.g., \`if (null === value)\`).
- **Arrow function blocks**: Always use explicit block bodies and returns in arrow functions (e.g., \`(x) => { return x; }\`).
- **Arrow functions**: Always use arrow functions rather than function declarations for all function definitions.
- **Explicit member accessibility**: Always use explicit accessibility modifiers (\`public\`/\`private\`/\`protected\`) for all class members.
- **typescript type definitions**: Enforce the use of \`type\` instead of \`interface\` for declaring typescript type definitions.
- **consistent-type-imports**: Enforce inline type imports when importing types.
- **isNil**: Perform nullable/boolean checks using Lodash \`isNil\` for explicit checks instead of implicit truthy/falsy evaluation on nullable values.
- **lodash/** method import path rules: Individual function path imports only, e.g., \`import map from "lodash/map.js"\`. Never import lodash globally.
- **React 19 rules**: Enforce functional components, purity, immutability, no class components, and no nested component definitions.
- **Ng signals and DI**: Use 信号 APIs (signals) over decorators, standalone components, and dynamic control flow in the Ng framework.
- **Vitest spec checks**: Expect spacing around test blocks, no assertions inside loops, and correct mock setups.

## Linter Conflict 3rd Solutions

- **Mock Promise auto-fix deadlock loops**: Avoid conflicts where unicorn removes a mock return value and triggers an empty function error. *Solution*: Use **lodash noop for mocking** (e.g. \`vi.fn(noop)\`) or insert an empty comment \`//\` inside the mock async body.
- **Array Methods**: **use lodash over native array methods** for all array operations (e.g., prefer \`map(arr, cb)\` from \`lodash/map.js\` over native \`arr.map(cb)\`).
- **Strict Boolean Expressions**: **use isNil, isString instead of !!** (or other type-guard helpers like \`isNumber\`) to perform nullable/boolean evaluation. Never cast values to a boolean using \`!!\`.
- **perfectionist object sorting vs partition comments**: Alphabetic sorting breaks logical pairings (e.g. \`{x, y}\`). *Solution*: Use partition comments (\`// partition\`) to prevent sorting.
- **Vitest hook bypass via \`onTestFinished\`**: Since hooks are forbidden (\`vitest/no-hooks\`), register mock and stub cleanups using Vitest's \`onTestFinished(cleanupFn)\` inside setup helper functions. This also avoids using \`try-finally\` blocks that trigger \`unicorn/try-complexity\`.
- **Vitest conditional test bypass**: Since conditionals are forbidden inside tests (\`vitest/no-conditional-in-test\`), split assertions of multiple states or conditions into multiple smaller test blocks, and avoid using \`if\` blocks directly in tests.
- **Drizzle dynamic queries**: Avoid re-assignment type errors and unsafe \`as any\` type-casting on query builders by calling \`.$dynamic()\` on the select statement to erase strict generic types.
- **Deletable properties vs Atomic writes**: Under strict TypeScript check, the \`delete\` operator requires properties to be optional. Instead of using \`delete\`, construct a new object that does not include the property (atomic writes), e.g., using destructuring: \`const { stack, ...rest } = row; return { ...rest, ...(!isNil(stack) ? { stack } : {}) };\`.
- **Zod output types**: Avoid using the deprecated \`schema._output\` property. Instead, import the inferred type from the schema's package, or use \`z.output<typeof schema>\` (or \`z.infer<typeof schema>\`).
- **TypeScript-ESLint compiler cascade warnings**: If eslint reports \`no-unsafe-assignment\` or \`no-unsafe-member-access\` on mocks/stubs, run \`tsc --noEmit\` to verify if generic parameters (e.g. \`Mock<Fn>\`) are incorrectly defined, which defaults the types to \`any\` (error types).

## Security Mitigations

- **SR-1**: Limit lint-fix attempts to a maximum of 3 iterations to prevent infinite loop execution.
- **SR-3**: Type checks must preserve exact falsy semantics (like empty string \`""\` or \`0\`) when modifying boolean checks to prevent logic bypasses.
- **SR-7**: All changes must be traceable, logged, and isolated in specific commits (no auto-push/commit without user permission).`,
  description:
    "Enforces monorepo-wide eslint resolution patterns and maps linter rules",
  name: "eslint-fixer"
});
