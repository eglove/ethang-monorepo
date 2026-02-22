import { describe, expect, it, vi } from "vitest";

import { getLatestReact } from "./get-react-version.ts";

describe("get-react-version", () => {
  it("should return react version on successful fetch", async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({ version: "18.2.0" }),
      ok: true,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await getLatestReact();
    expect(result).toEqual({ version: "18.2.0" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://registry.npmjs.org/react/latest",
    );
  });

  it("should return undefined on fetch error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    await expect(getLatestReact()).rejects.toThrow("Network error");
  });

  it("should return undefined on invalid json", async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({ invalid: "data" }),
      ok: true,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await getLatestReact();
    expect(result).toBeUndefined();
  });
});
