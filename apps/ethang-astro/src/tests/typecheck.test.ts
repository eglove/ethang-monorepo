import type { env } from "cloudflare:workers";

import compact from "lodash/compact.js";
import join from "lodash/join.js";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, expectTypeOf, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..", "..");

/**
Type-level any check. vitest's expectTypeOf().not.toBeAny() collapses to
ExpectAny for the large RPC return types, so this conditional is used
instead: 0 extends 1 & T holds only when T is any.
*/
type NotAny<T> = 0 extends 1 & T ? false : true;

describe("workspace type safety", () => {
  it(
    "type-checks without pulling sibling worker sources into the program",
    { timeout: 120_000 },
    () => {
      const result = spawnSync("pnpm exec tsc --noEmit", {
        cwd: appRoot,
        encoding: "utf8",
        shell: true,
        timeout: 120_000
      });
      const lines = compact([result.stdout, result.stderr]);
      const output = join(lines, "\n").slice(0, 4000);
      expect(result.status, output).toBe(0);
    }
  );

  it("keeps service binding RPC signatures concrete", () => {
    expectTypeOf<
      ReturnType<typeof env.ethang_rss.addSubscription>
    >().toEqualTypeOf<Promise<null>>();
    expectTypeOf<
      NotAny<Awaited<ReturnType<typeof env.ethang_rss.subscriptions>>>
    >().toEqualTypeOf<true>();
    expectTypeOf<
      NotAny<Awaited<ReturnType<typeof env.ethang_rss.allArticles>>>
    >().toEqualTypeOf<true>();
  });
});

describe("lint script", () => {
  it("type-checks as part of lint, like every other project", () => {
    const packageManifest = JSON.parse(
      readFileSync(path.resolve(appRoot, "package.json"), "utf8")
    );
    expect(packageManifest.scripts.lint).toContain("tsc --noEmit");
  });
});
