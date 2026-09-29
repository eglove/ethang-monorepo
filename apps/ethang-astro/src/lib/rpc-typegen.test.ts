import { describe, expect, it } from "vitest";

import {
  AUGMENTATION_MARKER,
  BOUND_APPS,
  buildRpcAugmentation
} from "./rpc-typegen.ts";

describe("buildRpcAugmentation", () => {
  it("types every bound app as an RPC service binding", () => {
    const augmentation = buildRpcAugmentation(BOUND_APPS);

    expect(augmentation).toContain("declare namespace Cloudflare {");
    expect(augmentation).toContain("interface Env {");
    for (const app of BOUND_APPS) {
      const bindingName = app.replaceAll("-", "_");
      expect(augmentation).toContain(`${bindingName}: Service<typeof import(`);
      expect(augmentation).toContain(`../../${app}/dist-types/src/index`);
    }
  });

  it("marks the augmentation with a stable idempotency marker", () => {
    expect(buildRpcAugmentation(BOUND_APPS)).toContain(AUGMENTATION_MARKER);
  });
});
