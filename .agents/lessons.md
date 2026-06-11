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

## Proven Patterns
Approaches confirmed to work well in this workspace.

- **Everything Search CLI (es) Fallback**: The `es` CLI relies on the Windows Everything IPC service. If the Everything service/application is not running, `es` fails. In this case, fall back to JetBrains WebStorm MCP `find_files_by_glob` or ripgrep (`rg`) to search for file paths.
- **ESLint and Lodash Compliance**: Avoid native `.filter`, `typeof === "string"`, and `.endsWith` on arrays/strings when using Lodash-preferred conventions. Additionally, avoid variable abbreviations like `srcDir` to prevent triggering `unicorn/prevent-abbreviations` (prefer descriptive names like `sourceDirectory`).
- **WebStorm Text Search**: For text searches, prefer using the WebStorm MCP tool `search_in_files_by_text` (passing `projectPath`) rather than broad `rtk rg` terminal commands. WebStorm utilizes its indexed project structure, which executes instantly and avoids background task timeouts/hangs.

