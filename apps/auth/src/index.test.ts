import { describe, expect, it } from "vitest";

import app from "./index.js";

describe("auth API", () => {
  it("should respond to OPTIONS or handle CORS", async () => {
    const response = await app.request("/", { method: "OPTIONS" });
    expect(response.status).toBe(204);
  });
});
