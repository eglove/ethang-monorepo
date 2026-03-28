import { describe, expect, it } from "vitest";

import { routes } from "../routes.ts";

describe("routes", () => {
  it("exports blog route", () => {
    expect(routes.blog).toBe("/blog");
  });

  it("exports courses route", () => {
    expect(routes.courses).toBe("/courses");
  });

  it("exports tips route", () => {
    expect(routes.tips).toBe("/tips");
  });
});
