import type { env } from "cloudflare:workers";

import compact from "lodash/compact.js";
import join from "lodash/join.js";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, expectTypeOf, it } from "vitest";

const appRoot = path.resolve(import.meta.dirname, "..", "..");

describe("workspace type safety", () => {
  it("type-checks without pulling sibling worker sources into the program", () => {
    const result = spawnSync("pnpm exec tsc --noEmit", {
      cwd: appRoot,
      encoding: "utf8",
      shell: true,
      timeout: 120_000,
    });
    const lines = compact([result.stdout, result.stderr]);
    const output = join(lines, "\n").slice(0, 4000);
    expect(result.status, output).toBe(0);
  });

  it("keeps service binding RPC signatures concrete", () => {
    expectTypeOf<
      Awaited<ReturnType<typeof env.ethang_rss.subscriptions>>
    >().not.toBeAny();
    expectTypeOf<
      Awaited<ReturnType<typeof env.ethang_rss.allArticles>>
    >().not.toBeAny();
    expectTypeOf<
      ReturnType<typeof env.ethang_rss.addSubscription>
    >().toEqualTypeOf<Promise<null>>();
  });
});

describe("lint script", () => {
  it("type-checks as part of lint, like every other project", () => {
    const packageManifest = JSON.parse(
      readFileSync(path.resolve(appRoot, "package.json"), "utf8"),
    ) as { scripts: { lint: string } };
    expect(packageManifest.scripts.lint).toBe(
      "eslint . --fix && pnpm tsc --noEmit",
    );
  });
});
