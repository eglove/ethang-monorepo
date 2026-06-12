# Learned Lessons

## Corrections
Rules from explicit user corrections — things the assistant did wrong and must not repeat.

- **Lodash Imports Must Be Individual**: Always import lodash functions individually using the path format (e.g. `import map from "lodash/map.js"`). Never use `import lodash from "lodash"` or `import { map } from "lodash"` — the path-based per-function import is required to keep bundle size small.
- **ESLint Auto-Fix Cycle Deadlock**: When mocking functions (like `vi.fn()`) in tests, watch out for conflicts between eslint rules. For example, using `vi.fn(async () => { return Promise.resolve(); })` will trigger `unicorn/no-useless-promise-resolve-reject`, which auto-fixes on save by stripping `return Promise.resolve()`. This leaves the function body empty: `vi.fn(async () => {})`, which then triggers `@typescript-eslint/no-empty-function`.
  - *Fix:* Insert a comment inside the body to prevent it from being classified as empty:
    ```typescript
    const mockNavigate = vi.fn(async () => {
      //
    });
    ```
- **Selective Revert Over Global Revert**: Never run global git resets or checkouts (like `git checkout -- .` or `git reset --hard`) when asked to revert agent-specific changes, as the user may have unrelated unstaged changes in their workspace. Always use `git restore` (or targeted checkout) explicitly on the specific files modified by the agent.
- **Explicit Returns in attempt/attemptAsync**: In strict TypeScript configurations (e.g. `TS7030` check), ensure that all code paths within the callback return an explicit value (e.g., a default fallback object or `undefined`) instead of throwing errors or relying on implicit returns, to prevent compilation failures without introducing runtime exception overhead.
- **Lodash isNil for Nullable Checks**: When checking anything nullable, always use `isNil()` from lodash (e.g. `isNil(val)` instead of checking against `undefined` or `null`).

## Proven Patterns
Approaches confirmed to work well in this workspace.

- **Everything Search CLI (es) Fallback**: The `es` CLI relies on the Windows Everything IPC service. If the Everything service/application is not running, `es` fails. In this case, fall back to JetBrains WebStorm MCP `find_files_by_glob` or ripgrep (`rg`) to search for file paths.
- **ESLint and Lodash Compliance**: Avoid native `.filter`, `typeof === "string"`, and `.endsWith` on arrays/strings when using Lodash-preferred conventions. Additionally, avoid variable abbreviations like `srcDir` to prevent triggering `unicorn/prevent-abbreviations` (prefer descriptive names like `sourceDirectory`).
- **WebStorm Text Search**: For text searches, prefer using the WebStorm MCP tool `search_in_files_by_text` (passing `projectPath`) rather than broad `rtk rg` terminal commands. WebStorm utilizes its indexed project structure, which executes instantly and avoids background task timeouts/hangs.
- **Strict TypeScript/ESLint checks**: When working under strict ESLint rules (like those in `eslint-config`), avoid non-null assertions (`!`) by using TypeScript type narrowing, and explicitly check nullable values (e.g., `!isNil(val)`) to satisfy `@typescript-eslint/strict-boolean-expressions`. Also, do not mix destructuring and property access of the same object in the same function scope to satisfy `unicorn/consistent-destructuring`.

