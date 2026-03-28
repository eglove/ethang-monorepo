import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ethang/toolbelt/http/cookie.js", () => ({
  getCookieValue: vi.fn(),
}));

import { getCookieValue } from "@ethang/toolbelt/http/cookie.js";
import type { Mock } from "vitest";

import { GlobalStore } from "./global-store-properties.ts";

const makeContext = (
  url: string,
  options: {
    acceptLanguage?: string;
    timezone?: string | undefined;
  } = {},
) => ({
  req: {
    header: (name: string) => {
      if (name === "Accept-Language") return options.acceptLanguage ?? null;
      return null;
    },
    raw: {
      cf: options.timezone !== undefined ? { timezone: options.timezone } : {},
      headers: new Headers(),
    },
    url,
  },
});

describe("GlobalStore", () => {
  let store: GlobalStore;

  beforeEach(() => {
    store = new GlobalStore();
    // Default: getCookieValue returns Error so setAuthToken is not called
    (getCookieValue as Mock).mockReturnValue(new Error("no cookie"));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("default state", () => {
    it("starts unauthenticated", () => {
      expect(store.isAuthenticated).toBe(false);
      expect(store.authToken).toBeNull();
    });

    it("starts with null userId", () => {
      expect(store.userId).toBeNull();
    });

    it("starts with default locale en-US", () => {
      expect(store.locale).toBe("en-US");
    });

    it("starts with UTC timezone", () => {
      expect(store.timezone).toBe("UTC");
    });

    it("starts with ethang.dev origin", () => {
      expect(store.origin).toBe("https://ethang.dev");
    });

    it("starts at root pathname", () => {
      expect(store.pathname).toBe("/");
    });
  });

  describe("setup()", () => {
    it("extracts origin from request URL", async () => {
      const ctx = makeContext("https://mysite.com/about");
      await store.setup(ctx as never);
      expect(store.origin).toBe("https://mysite.com");
    });

    it("extracts pathname from request URL", async () => {
      const ctx = makeContext("https://example.com/blog/my-post");
      await store.setup(ctx as never);
      expect(store.pathname).toBe("/blog/my-post");
    });

    it("uses Cloudflare timezone when available", async () => {
      const ctx = makeContext("https://example.com/", {
        timezone: "America/New_York",
      });
      await store.setup(ctx as never);
      expect(store.timezone).toBe("America/New_York");
    });

    it("falls back to UTC when cf.timezone is not present", async () => {
      const ctx = makeContext("https://example.com/", { timezone: undefined });
      await store.setup(ctx as never);
      expect(store.timezone).toBe("UTC");
    });

    it("takes the first locale from Accept-Language header", async () => {
      const ctx = makeContext("https://example.com/", {
        acceptLanguage: "fr-FR,fr;q=0.9,en;q=0.8",
      });
      await store.setup(ctx as never);
      expect(store.locale).toBe("fr-FR");
    });

    it("sets locale to empty string when Accept-Language header returns null", async () => {
      // lodash split(null, ",") → toString(null)="" → [""] → first([""])="" → ""??en-US = ""
      const ctx = makeContext("https://example.com/");
      await store.setup(ctx as never);
      expect(store.locale).toBe("");
    });

    it("does not call fetch when getCookieValue returns an Error", async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);
      (getCookieValue as Mock).mockReturnValue(new Error("no cookie"));

      const ctx = makeContext("https://example.com/");
      await store.setup(ctx as never);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("sets isAuthenticated true when auth server responds ok", async () => {
      (getCookieValue as Mock).mockReturnValue("valid-token");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          json: async () => ({ sub: "user-abc" }),
          ok: true,
        }),
      );

      const ctx = makeContext("https://example.com/");
      await store.setup(ctx as never);

      expect(store.isAuthenticated).toBe(true);
      expect(store.authToken).toBe("valid-token");
      expect(store.userId).toBe("user-abc");
    });

    it("sets isAuthenticated false when auth server responds not ok", async () => {
      (getCookieValue as Mock).mockReturnValue("bad-token");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          json: async () => ({ sub: "user-abc" }),
          ok: false,
        }),
      );

      const ctx = makeContext("https://example.com/");
      await store.setup(ctx as never);

      expect(store.isAuthenticated).toBe(false);
      expect(store.authToken).toBeNull();
    });

    it("sends auth token in X-Token header to verify endpoint", async () => {
      (getCookieValue as Mock).mockReturnValue("my-secret-token");
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ sub: "user-1" }),
        ok: true,
      });
      vi.stubGlobal("fetch", mockFetch);

      const ctx = makeContext("https://example.com/");
      await store.setup(ctx as never);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://auth.ethang.dev/verify",
        expect.objectContaining({
          headers: expect.objectContaining({ "X-Token": "my-secret-token" }),
        }),
      );
    });

    it("handles fetch errors gracefully without throwing", async () => {
      (getCookieValue as Mock).mockReturnValue("token");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error")),
      );

      const ctx = makeContext("https://example.com/");
      await expect(store.setup(ctx as never)).resolves.not.toThrow();
    });

    it("sends empty string in X-Token header when token value is null", async () => {
      // getCookieValue returns null (not an Error), so setAuthToken(null) is called
      (getCookieValue as Mock).mockReturnValue(null);
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ sub: "user-1" }),
        ok: true,
      });
      vi.stubGlobal("fetch", mockFetch);

      const ctx = makeContext("https://example.com/");
      await store.setup(ctx as never);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://auth.ethang.dev/verify",
        expect.objectContaining({
          headers: expect.objectContaining({ "X-Token": "" }),
        }),
      );
    });
  });
});
