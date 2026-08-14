import isNil from "lodash/isNil.js";
import { describe, expect, it, vi } from "vitest";

const { addFeed, markArticleRead, removeFeed } = vi.hoisted(() => {
  return {
    addFeed: vi.fn(async () => {
      return { success: true };
    }),
    markArticleRead: vi.fn(async () => {
      return { success: true };
    }),
    removeFeed: vi.fn(async () => {
      return { success: true };
    })
  };
});

vi.mock("astro:actions", () => {
  return {
    defineAction: <T>(config: { handler: T }) => {
      return config.handler;
    }
  };
});

vi.mock("cloudflare:workers", () => {
  return {
    env: { ethang_rss: "rss-worker" }
  };
});

vi.mock("../lib/rss.ts", () => {
  return {
    addFeed,
    markArticleRead,
    removeFeed
  };
});

import { server } from "./index.ts";

const WORKER = "rss-worker";
const FEED_URL = "https://x/feed";
const UNAUTHORIZED = "Unauthorized";
const SESSION = "session";
const NO_SESSION = "rejects when there is no session";
const COOKIE_PATH = { path: "/" } as const;
const EMAIL = "ada@example.com";

const sessionUser = JSON.stringify({
  email: EMAIL,
  sessionToken: "token",
  username: "ada"
});

const cookies = (sessionValue: null | string = null) => {
  return {
    delete: vi.fn(),
    get: vi.fn((name: string) => {
      return name === SESSION && !isNil(sessionValue)
        ? { value: sessionValue }
        : undefined;
    }),
    set: vi.fn()
  };
};

const call = (function_: any, input: unknown, context: unknown) => {
  return function_(input, context);
};

describe("addFeed action", () => {
  it(NO_SESSION, async () => {
    const result = await call(
      server.addFeed,
      { xmlUrl: FEED_URL },
      { cookies: cookies(null) }
    );

    expect(result).toEqual({ error: UNAUTHORIZED });
    expect(addFeed).not.toHaveBeenCalled();
  });

  it("adds the feed for an authenticated user", async () => {
    const result = await call(
      server.addFeed,
      { xmlUrl: FEED_URL },
      { cookies: cookies(sessionUser) }
    );

    expect(addFeed).toHaveBeenCalledWith(WORKER, {
      sessionToken: "token",
      xmlAddress: FEED_URL
    });
    expect(result).toEqual({ success: true });
  });
});

describe("markArticleRead action", () => {
  it(NO_SESSION, async () => {
    const result = await call(
      server.markArticleRead,
      { articleId: "a1" },
      { cookies: cookies(null) }
    );

    expect(result).toEqual({ error: UNAUTHORIZED });
  });

  it("marks the article read for an authenticated user", async () => {
    const result = await call(
      server.markArticleRead,
      { articleId: "a1" },
      { cookies: cookies(sessionUser) }
    );

    expect(markArticleRead).toHaveBeenCalledWith(WORKER, {
      articleId: "a1",
      isRead: true,
      sessionToken: "token"
    });
    expect(result).toEqual({ success: true });
  });
});

describe("removeFeed action", () => {
  it(NO_SESSION, async () => {
    const result = await call(
      server.removeFeed,
      { feedId: "f1" },
      { cookies: cookies(null) }
    );

    expect(result).toEqual({ error: UNAUTHORIZED });
  });

  it("removes the feed for an authenticated user", async () => {
    const result = await call(
      server.removeFeed,
      { feedId: "f1" },
      { cookies: cookies(sessionUser) }
    );

    expect(removeFeed).toHaveBeenCalledWith(WORKER, {
      feedId: "f1",
      sessionToken: "token"
    });
    expect(result).toEqual({ success: true });
  });
});

describe("signOut action", () => {
  it("deletes the session cookie and reports success", async () => {
    const c = cookies(sessionUser);
    const result = await call(server.signOut, {}, { cookies: c });

    expect(c.delete).toHaveBeenCalledWith(SESSION, COOKIE_PATH);
    expect(result).toEqual({ success: true });
  });
});

describe("signIn action", () => {
  it("sets the session cookie and returns the username on success", async () => {
    const fetchMock = vi.fn(async () => {
      return Response.json(
        {
          email: EMAIL,
          sessionToken: "token",
          username: "ada"
        },
        { status: 200 }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const c = cookies();
    const result = await call(
      server.signIn,
      { email: EMAIL, password: "secret" },
      { cookies: c }
    );

    expect(fetchMock).toHaveBeenCalled();
    expect(c.set).toHaveBeenCalledWith(
      SESSION,
      expect.any(String),
      expect.objectContaining({ httpOnly: true, path: "/" })
    );
    expect(result).toEqual({ data: { username: "ada" } });

    vi.unstubAllGlobals();
  });

  it("reports invalid credentials when the auth service rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response("nope", { status: 401 });
      })
    );

    const result = await call(
      server.signIn,
      { email: EMAIL, password: "secret" },
      { cookies: cookies() }
    );

    expect(result).toEqual({ error: "Invalid Credentials" });

    vi.unstubAllGlobals();
  });

  it("reports an unexpected error when the fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );

    const result = await call(
      server.signIn,
      { email: EMAIL, password: "secret" },
      { cookies: cookies() }
    );

    expect(result).toEqual({ error: "An unexpected error occurred" });

    vi.unstubAllGlobals();
  });

  it("reports an invalid response when the payload is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return Response.json({ email: "ada" }, { status: 200 });
      })
    );

    const result = await call(
      server.signIn,
      { email: EMAIL, password: "secret" },
      { cookies: cookies() }
    );

    expect(result).toEqual({ error: "Invalid response from server" });

    vi.unstubAllGlobals();
  });

  it("reports an unexpected error when the response body cannot be parsed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response("not-json", { status: 200 });
      })
    );

    const result = await call(
      server.signIn,
      { email: EMAIL, password: "secret" },
      { cookies: cookies() }
    );

    expect(result).toEqual({ error: "An unexpected error occurred" });

    vi.unstubAllGlobals();
  });
});
