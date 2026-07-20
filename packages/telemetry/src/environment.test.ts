import { describe, expect, it } from "vitest";

// The environment.ts file only exports a type alias: `export type CloudflareObservability = true;`
// This is a type-only export that gets inlined at use sites. We import the type to verify it exists.
import type { CloudflareObservability } from "./environment.ts";

describe("environment.ts type export", () => {
  it("exports CloudflareObservability as true", () => {
    const _obs: CloudflareObservability = true;
    expect(_obs).toBe(true);
  });
});