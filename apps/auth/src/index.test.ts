import { auth } from "@ethang/intl/en/auth.ts";
import { Effect } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import isNumber from "lodash/isNumber.js";
import isString from "lodash/isString.js";
import omit from "lodash/omit.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "./index.js";
import { carryUserAuthCommand } from "./infrastructure/user/aggregate.js";

const { EMAIL, PASSWORD, SECRET, TEST_USERNAME } = auth;
const TEST_EMAIL = EMAIL;
const TEST_PASSWORD = PASSWORD;
const TEST_USERNAME_VALUE = TEST_USERNAME;
const TEST_SECRET = SECRET;
const VALID_TOKEN = "valid-token";

const { hoistedEmail, hoistedToken, mockUser } = vi.hoisted(() => {
  const PWD_KEY = "password";
  const MOCK_VAL = "internal-value";
  return {
    hoistedEmail: "test@test.com",
    hoistedToken: "test-jwt-token",
    mockUser: {
      email: "test@test.com",
      id: "user-1",
      lastLoggedIn: "2024-01-01T00:00:00.000Z",
      [PWD_KEY]: MOCK_VAL,
      role: "user",
      sessionToken: "test-jwt-token",
      updatedAt: "2024-01-01T00:00:00.000Z",
      username: "testuser"
    }
  };
});

vi.mock("./get-database.ts", () => {
  return {
    getDatabase: vi.fn().mockReturnValue({})
  };
});

vi.mock("./infrastructure/user/repo.js", () => {
  return {
    createUserRepo: vi.fn().mockReturnValue({
      fetch: vi.fn().mockReturnValue(Effect.succeed(null)),
      save: vi.fn().mockReturnValue(Effect.succeed(mockUser))
    })
  };
});

vi.mock("./infrastructure/user/password-service.js", () => {
  return {
    createPasswordService: vi.fn().mockReturnValue({
      compare: vi.fn().mockReturnValue(Effect.succeed(true)),
      hash: vi.fn().mockReturnValue(Effect.succeed("hashed-password"))
    })
  };
});

vi.mock("./infrastructure/user/aggregate.js", () => {
  return {
    carryUserAuthCommand: vi.fn().mockReturnValue(Effect.succeed(mockUser))
  };
});

vi.mock("./infrastructure/user/token-service.js", () => {
  return {
    createTokenService: vi.fn().mockReturnValue({
      sign: vi.fn().mockReturnValue(Effect.succeed(hoistedToken)),
      verify: vi
        .fn()
        .mockReturnValue(Effect.succeed({ payload: { email: hoistedEmail } }))
    })
  };
});

const SET_COOKIE = "Set-Cookie";
const VALIDATION_ERROR_MESSAGE = "Validation failed";
const INVALID_BODY = JSON.stringify({ notAValidField: "boom" });
const JSON_CONTENT_TYPE_HEADERS = {
  "Content-Type": "application/json"
} as const;

type CookieStoreMock = {
  delete: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  getAll: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

type GlobalAugmented = GlobalWithCaptured & GlobalWithCookie;
type GlobalWithCaptured = { __capturedCookies?: string[] };
type GlobalWithCookie = { cookieStore?: CookieStoreMock };

const asGlobal = () => {
  return globalThis as unknown as GlobalAugmented;
};

const cookieStoreMock = () => {
  return {
    delete: vi.fn().mockResolvedValue(null),
    get: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    set: vi
      .fn()
      .mockImplementation(
        async (
          init: { name: string; value: string } & Record<string, unknown>
        ) => {
          const segments: string[] = [`${init.name}=${init.value}`];
          for (const [key, value] of Object.entries(init)) {
            if ("name" === key || "value" === key || isNil(value)) {
              // eslint-disable-next-line no-continue
              continue;
            }
            if (true === value) {
              segments.push(`; ${key}`);
              // eslint-disable-next-line @ethang/prefer-effect-datetime
            } else if (value instanceof Date) {
              // eslint-disable-next-line @ethang/prefer-effect-datetime
              segments.push(`; ${key}=${value.toUTCString()}`);
            } else if (isString(value) || isNumber(value)) {
              segments.push(`; ${key}=${String(value)}`);
            } else {
              // skip unsupported value types
            }
          }
          const existing = asGlobal().__capturedCookies ?? [];
          existing.push(segments.join(""));
          asGlobal().__capturedCookies = existing;
        }
      )
  };
};

const installCookieStorePolyfill = () => {
  const stub = cookieStoreMock();
  asGlobal().cookieStore = stub;
  return stub;
};

beforeEach(() => {
  asGlobal().__capturedCookies = [];
  installCookieStorePolyfill();
});

afterEach(() => {
  delete asGlobal().cookieStore;
  delete asGlobal().__capturedCookies;
});

const lastSetCookie = () => {
  const list = asGlobal().__capturedCookies;
  if (list === undefined || isEmpty(list)) {
    return null;
  }
  return list.at(-1) ?? null;
};

type RequestInit = {
  body?: string;
  headers?: Record<string, string>;
  method: string;
};

const sendRequest = async (
  path: string,
  init: RequestInit,
  environment?: Record<string, string>
) => {
  const arguments_:
    [string, RequestInit, Record<string, string>] | [string, RequestInit] =
    isNil(environment) ? [path, init] : [path, init, environment];

  const response = await (app.request as any)(...arguments_);
  const captured = lastSetCookie();
  if (!isNil(captured)) {
    response.headers.append(SET_COOKIE, captured);
  }
  return response;
};

describe("POST /sign-up", () => {
  it("should return success when sign up is valid", async () => {
    const response = await sendRequest(
      "/sign-up",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          username: TEST_USERNAME_VALUE
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockUser);
    const cookieSet = response.headers.get(SET_COOKIE);
    expect(cookieSet).toContain("ethang-auth-token=");
  });

  it("should return 500 error when sign up fails", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.fail(new Error("Sign up failed"));
    });

    const response = await sendRequest(
      "/sign-up",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          username: TEST_USERNAME_VALUE
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Sign up failed" });
  });

  it("should return 500 with string error when sign up throws non-Error", async () => {
    // @ts-expect-error for test
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.fail("STRING_ERROR");
    });

    const response = await sendRequest(
      "/sign-up",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          username: TEST_USERNAME_VALUE
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "STRING_ERROR" });
  });

  it("should return success when sign up is valid without username", async () => {
    const response = await sendRequest(
      "/sign-up",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockUser);
  });

  it("should return success when sign up with fallback token-auth", async () => {
    const response = await sendRequest(
      "/sign-up",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          username: TEST_USERNAME_VALUE
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {}
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockUser);
  });

  it("should return success when sign up is valid but no token", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed({ ...mockUser, sessionToken: null });
    });

    const response = await sendRequest(
      "/sign-up",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          username: TEST_USERNAME_VALUE
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(200);
    const body: Record<string, unknown> = await response.json();
    expect(body["sessionToken"]).toBeNull();
  });

  it("should return success when sign up result omits sessionToken property", async () => {
    // strip sessionToken from the result to exercise the false branch of
    // `"sessionToken" in result` in setAuthCookie
    const withoutToken = omit(mockUser, "sessionToken");
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed(withoutToken as typeof mockUser);
    });

    const response = await sendRequest(
      "/sign-up",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          username: TEST_USERNAME_VALUE
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get(SET_COOKIE)).toBeNull();
  });
});

describe("POST /sign-in", () => {
  it("should return success when sign in is valid but no token", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed({ ...mockUser, sessionToken: null });
    });

    const response = await sendRequest(
      "/sign-in",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(200);
    const body: Record<string, unknown> = await response.json();
    expect(body["sessionToken"]).toBeNull();
  });

  it("should return success when sign in result omits sessionToken property", async () => {
    const withoutToken = omit(mockUser, "sessionToken");
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed(withoutToken as typeof mockUser);
    });

    const response = await sendRequest(
      "/sign-in",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get(SET_COOKIE)).toBeNull();
  });

  it("should return success when sign in is valid", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed(mockUser);
    });

    const response = await sendRequest(
      "/sign-in",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockUser);
    const cookieSet = response.headers.get(SET_COOKIE);
    expect(cookieSet).toContain("ethang-auth-token=");
  });

  it("should return 401 when sign in fails", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.fail(new Error("Unauthorized"));
    });

    const response = await sendRequest(
      "/sign-in",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});

describe("GET /verify", () => {
  it("should verify token with env secret", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed({ payload: { email: hoistedEmail } });
    });

    const response = await sendRequest(
      "/verify",
      {
        headers: { "X-Token": VALID_TOKEN },
        method: "GET"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ email: TEST_EMAIL });
  });

  it("should verify token with fallback when token-auth is missing", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed({ payload: { email: hoistedEmail } });
    });

    const response = await sendRequest(
      "/verify",
      {
        headers: { "X-Token": VALID_TOKEN },
        method: "GET"
      },
      {}
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ email: TEST_EMAIL });
  });

  it("should return 401 if token is missing", async () => {
    const response = await sendRequest(
      "/verify",
      {
        method: "GET"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("should return 401 if token is invalid", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.fail(new Error("Invalid token"));
    });

    const response = await sendRequest(
      "/verify",
      {
        headers: { "X-Token": "invalid-token" },
        method: "GET"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("should return result directly when no payload property", async () => {
    // @ts-expect-error for test
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed({ email: hoistedEmail });
    });

    const response = await sendRequest(
      "/verify",
      {
        headers: { "X-Token": VALID_TOKEN },
        method: "GET"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ email: TEST_EMAIL });
  });
});

describe("POST /verify", () => {
  it("should validate credentials", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed(mockUser);
    });

    const response = await sendRequest(
      "/verify",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockUser);
  });

  it("should return 401 if credentials are invalid", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.fail(new Error("Unauthorized"));
    });

    const response = await sendRequest(
      "/verify",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      },
      {
        "token-auth": TEST_SECRET
      }
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});

describe("auth API", () => {
  it("should respond to OPTIONS or handle CORS", async () => {
    const response = await sendRequest("/", { method: "OPTIONS" });
    expect(response.status).toBe(204);
  });

  it("should return 400 when /sign-up body is invalid", async () => {
    const response = await sendRequest(
      "/sign-up",
      {
        body: INVALID_BODY,
        headers: JSON_CONTENT_TYPE_HEADERS,
        method: "POST"
      },
      { "token-auth": TEST_SECRET }
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: VALIDATION_ERROR_MESSAGE });
  });

  it("should return 400 when /sign-in body is invalid", async () => {
    const response = await sendRequest(
      "/sign-in",
      {
        body: INVALID_BODY,
        headers: JSON_CONTENT_TYPE_HEADERS,
        method: "POST"
      },
      { "token-auth": TEST_SECRET }
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: VALIDATION_ERROR_MESSAGE });
  });

  it("should return 400 when POST /verify body is invalid", async () => {
    const response = await sendRequest(
      "/verify",
      {
        body: INVALID_BODY,
        headers: JSON_CONTENT_TYPE_HEADERS,
        method: "POST"
      },
      { "token-auth": TEST_SECRET }
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: VALIDATION_ERROR_MESSAGE });
  });
});
