import { describe, expect, it } from "vitest";

import { jsonHeaders } from "./http.ts";

describe("http constants", () => {
  it("exports jsonHeaders with the application/json content type", () => {
    expect(jsonHeaders).toStrictEqual({
      "Content-Type": "application/json"
    });
  });
});
