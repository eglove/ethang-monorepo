import { describe, expect, it } from "vitest";

import { unwrapRpc } from "./rpc.ts";

describe("unwrapRpc", () => {
  it("parses a Response body as JSON", async () => {
    const response = Response.json({ ok: true });

    await expect(unwrapRpc(response)).resolves.toEqual({ ok: true });
  });

  it("parses a Response wrapped in a promise", async () => {
    const response = Response.json({ value: 7 });

    await expect(unwrapRpc(Promise.resolve(response))).resolves.toEqual({
      value: 7
    });
  });

  it("returns a non-Response value unchanged", async () => {
    await expect(unwrapRpc(Promise.resolve({ x: 1 }))).resolves.toEqual({
      x: 1
    });
    await expect(unwrapRpc(42 as never)).resolves.toBe(42);
  });
});
