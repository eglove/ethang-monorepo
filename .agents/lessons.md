# Learned Lessons

## Corrections

- **ESLint Auto-Fix Cycle Deadlock**: When mocking functions (like `vi.fn()`) in tests, watch out for conflicts between eslint rules. For example, using `vi.fn(async () => { return Promise.resolve(); })` will trigger `unicorn/no-useless-promise-resolve-reject`, which auto-fixes on save by stripping `return Promise.resolve()`. This leaves the function body empty: `vi.fn(async () => {})`, which then triggers `@typescript-eslint/no-empty-function`.
  - *Fix:* Insert a comment inside the body to prevent it from being classified as empty:
    ```typescript
    const mockNavigate = vi.fn(async () => {
      //
    });
    ```

## Proven Patterns

*(none yet)*
