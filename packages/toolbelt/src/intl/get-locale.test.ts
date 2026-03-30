import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getLocale } from "./get-locale.ts";

const ACCEPT_LANGUAGE = "accept-language";

describe(getLocale, () => {
  describe("accept-language source", () => {
    it("returns locale from Accept-Language header string", () => {
      const result = getLocale([ACCEPT_LANGUAGE], "en-US,en;q=0.9");

      expect(result).toBe("en-US");
    });

    it("returns null when source is not provided", () => {
      const result = getLocale([ACCEPT_LANGUAGE]);

      expect(result).toBeNull();
    });

    describe("falls through to the next source when accept-language source is absent", () => {
      beforeEach(() => {
        vi.stubGlobal("navigator", { language: "fr-FR" });
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it("uses the next source in order", () => {
        const result = getLocale([ACCEPT_LANGUAGE, "navigator"]);

        expect(result).toBe("fr-FR");
      });
    });
  });

  describe("cookie source", () => {
    it("returns null when source and valueName are not provided", () => {
      const result = getLocale(["cookie"]);

      expect(result).toBeNull();
    });

    it("returns null when source is missing", () => {
      const result = getLocale(["cookie"], undefined, "locale");

      expect(result).toBeNull();
    });

    it("returns locale from cookie string", () => {
      const result = getLocale(["cookie"], "locale=en-GB; Path=/", "locale");

      expect(result).toBe("en-GB");
    });
  });

  describe("navigator source", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", { language: "de-DE" });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns navigator.language", () => {
      const result = getLocale(["navigator"]);

      expect(result).toBe("de-DE");
    });
  });

  describe("localStorage source", () => {
    beforeEach(() => {
      vi.stubGlobal("localStorage", {
        getItem: vi.fn().mockReturnValue("ja-JP"),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns value from localStorage", () => {
      const result = getLocale(["localStorage"], undefined, "locale");

      expect(result).toBe("ja-JP");
    });

    it("returns null when valueName is not provided", () => {
      const result = getLocale(["localStorage"]);

      expect(result).toBeNull();
    });
  });

  it("returns null when no source type matches", () => {
    const result = getLocale(["navigator"]);

    expect(result).toBeNull();
  });

  describe("respects source type order — first matching wins", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", { language: "es-ES" });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns the first source that resolves", () => {
      const result = getLocale(["navigator", ACCEPT_LANGUAGE], "en-US");

      expect(result).toBe("es-ES");
    });
  });
});
