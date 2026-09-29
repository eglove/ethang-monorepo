/*
Augment the cf-generated Cloudflare.Env with RPC-typed service bindings.

`cf workers types` types service bindings declared with a worker name string
as plain `Fetcher`, losing RPC method signatures. The generated
`.cloudflare/types/index.d.ts` is a module, so its `Cloudflare` namespace
merges with a same-module `declare namespace` block: appending one that
redeclares each service binding as `Service<typeof import(...)>` from the
sibling's emitted declarations keeps the exact RPC method signatures for
consumers, while `skipLibCheck` keeps the declaration files themselves out
of type checking. The sibling declarations are produced by
`emit-rpc-declarations` (tsconfig.rpc.json in each bound app) and must be
regenerated via `pnpm cf-typegen` whenever a sibling's RPC surface changes.
*/

import map from "lodash/map.js";
export const BOUND_APPS = [
  "ethang-courses",
  "ethang-rss",
  "job-applications"
] as const;

export const GENERATED_TYPES_PATH = ".cloudflare/types/index.d.ts";
export const RPC_DECLARATIONS_DIR = "dist-types";

export const AUGMENTATION_MARKER = "RPC bindings typed from sibling";

/**
Build the namespace-merge block appended to the generated types file.
The import specifiers resolve from the app's src/ directory, where the
generated types file lives two levels up.
*/
export const buildRpcAugmentation = (boundApps: readonly string[]) => {
  const rpcBindingLines = map(boundApps, (app) => {
    const bindingName = app.replaceAll("-", "_");
    const specifier = `../../${app}/${RPC_DECLARATIONS_DIR}/src/index`;
    return `\t\t${bindingName}: Service<typeof import(${JSON.stringify(specifier)}).default>;`;
  });

  return [
    "",
    `// ${AUGMENTATION_MARKER} declaration outputs (see src/lib/rpc-typegen.ts).`,
    "declare namespace Cloudflare {",
    "\tinterface Env {",
    ...rpcBindingLines,
    "\t}",
    "}",
    ""
  ].join("\n");
};
