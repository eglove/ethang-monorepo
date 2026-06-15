import type { ComponentType, ReactNode } from "react";

import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authStore } from "../components/auth/auth-store.ts";
import {
  decodeHtmlEntities,
  parseXmlUrl
} from "../components/rss/utilities.ts";
import { Route } from "./rss.tsx";

const mockNavigate = vi.fn(async () => {
  //
});

let redirectMock: unknown = null;

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@tanstack/react-router"
  );
  return {
    ...actual,
    createFileRoute: (path: string) => {
      return (options: {
        beforeLoad?: () => void;
        component: ComponentType;
      }) => {
        return {
          options,
          path,
          useSearch: () => {
            return {};
          }
        };
      };
    },
    Link: ({
      children,
      href,
      to
    }: Readonly<{ children: ReactNode; href?: string; to?: string }>) => {
      return <a href={to ?? href}>{children}</a>;
    },
    redirect: (_arguments: unknown) => {
      redirectMock = _arguments;
      throw new Error("Redirecting");
    },
    useNavigate: () => {
      return mockNavigate;
    }
  };
});

describe("RSS Feature", () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.reset();
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    redirectMock = null;
  });

  describe("URL Parser Helper", () => {
    it("extracts hostname as title and origin as website from a valid XML URL", () => {
      const result = parseXmlUrl("https://example.com/feed.xml");
      expect(result).toEqual({
        title: "example.com",
        website: "https://example.com",
        xmlAddress: "https://example.com/feed.xml"
      });
    });

    it("returns empty strings for title and website if the URL is invalid", () => {
      const result = parseXmlUrl("not-a-valid-url");
      expect(result).toEqual({
        title: "",
        website: "",
        xmlAddress: "not-a-valid-url"
      });
    });
  });

  describe("RSS Route Protection", () => {
    it("redirects unauthenticated user to login route with redirect parameter", () => {
      // Setup state where no user is logged in
      authStore.signOut();

      attempt(() => {
        // @ts-expect-error for test
        Route.options.beforeLoad?.();
      });

      expect(redirectMock).toEqual({
        search: {
          redirect: "/rss"
        },
        to: "/login"
      });
    });

    it("does not redirect when user is authenticated", () => {
      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      let redirectThrown = false;
      const result = attempt(() => {
        // @ts-expect-error for test
        Route.options.beforeLoad?.();
      });

      if (isError(result)) {
        redirectThrown = true;
      }

      expect(redirectThrown).toBe(false);
    });
  });

  describe("HTML Entity Decoder Helper", () => {
    it("decodes HTML entities correctly", () => {
      expect(decodeHtmlEntities("Test &amp; Co")).toBe("Test & Co");
      expect(decodeHtmlEntities("&#037;")).toBe("%");
      expect(decodeHtmlEntities("Hello &quot;World&quot;")).toBe(
        'Hello "World"'
      );
    });

    it("returns original string if empty or undefined", () => {
      expect(decodeHtmlEntities("")).toBe("");

      expect(decodeHtmlEntities(null as unknown as string)).toBeNull();
    });

    it("returns original string if DOMParser throws an error", () => {
      const originalDOMParser = DOMParser;
      // @ts-expect-error for test
      // eslint-disable-next-line unicorn/no-global-object-property-assignment
      globalThis.DOMParser = class extends originalDOMParser {
        // @ts-expect-error for test
        public override parseFromString() {
          throw new Error("mock error");
        }
      };

      try {
        expect(decodeHtmlEntities("some text")).toBe("some text");
      } finally {
        // eslint-disable-next-line unicorn/no-global-object-property-assignment
        globalThis.DOMParser = originalDOMParser;
      }
    });
  });
});
