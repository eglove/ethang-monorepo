import { describe, expect, it } from "vitest";

import { DEPLOY_TIME } from "./deploy-info.ts";

describe("DEPLOY_TIME", () => {
  it("is a string", () => {
    expect(typeof DEPLOY_TIME).toBe("string");
  });

  it("is a valid ISO 8601 date string", () => {
    const date = new Date(DEPLOY_TIME);
    expect(Number.isNaN(date.getTime())).toBe(false);
  });

  it("represents a point in time after 2024", () => {
    const date = new Date(DEPLOY_TIME);
    expect(date.getFullYear()).toBeGreaterThanOrEqual(2025);
  });
});
