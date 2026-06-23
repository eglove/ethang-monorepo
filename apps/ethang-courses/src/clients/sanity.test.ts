import { describe, expect, it } from "vitest";

import { sanityClient } from "./sanity.ts";

describe("sanityClient", () => {
  it("should be created with the correct configuration", () => {
    expect(sanityClient).toBeDefined();
    expect(sanityClient.config()).toMatchObject({
      apiVersion: "1",
      dataset: "production",
      projectId: "3rkvshhk",
      useCdn: true
    });
  });
});
