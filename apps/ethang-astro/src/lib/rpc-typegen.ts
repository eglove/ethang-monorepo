import replace from "lodash/replace.js";

/**
Rewrite wrangler-generated service binding imports from sibling worker
sources to their emitted declaration files.

Running `wrangler types` with multiple `--config` flags emits bindings like
`Service<typeof import("../ethang-rss/src/index").default>`. Those specifiers
pull sibling source files into this app's TypeScript program, where the only
global `Env` is this app's Env, so sibling code fails to type-check against
bindings it never declared.

Pointing the specifiers at each sibling's emitted `dist-types` declarations
keeps the exact RPC method signatures for consumers, while `skipLibCheck`
keeps the declaration files themselves out of type checking. The sibling
declarations are produced by `emit-rpc-declarations` (tsconfig.rpc.json in
each bound app) and must be regenerated via `pnpm cf-typegen` whenever a
sibling's RPC surface changes.
*/

export const BOUND_APPS = [
  "ethang-courses",
  "ethang-rss",
  "job-applications"
] as const;

export const GENERATED_TYPES_FILENAME = "worker-configuration.d.ts";
export const RPC_DECLARATIONS_DIR = "dist-types";

const SERVICE_BINDING_IMPORT =
  /\.\.\/(ethang-courses|ethang-rss|job-applications)\/src\/index/gu;

export const rewriteServiceBindingImports = (content: string) => {
  return replace(
    content,
    SERVICE_BINDING_IMPORT,
    (_match: string, app: string) => {
      return `../${app}/${RPC_DECLARATIONS_DIR}/index`;
    }
  );
};
