import { auth } from "@ethang/intl/en/auth.ts";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { app } from "./index.js";
import { carryUserAuthCommand } from "./infrastructure/user/aggregate.js";
import { createUserRepo } from "./infrastructure/user/repo.js";
import { createTokenService } from "./infrastructure/user/token-service.js";

const { EMAIL, PASSWORD, SECRET, TEST_USERNAME } = auth;
const TEST_EMAIL = EMAIL;
const TEST_PASSWORD = PASSWORD;
const TEST_USERNAME_VALUE = TEST_USERNAME;
const TEST_SECRET = SECRET;

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

describe("POST /sign-up", () => {
  it("should return success when sign up is valid", async () => {
    const response = await app.request(
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

    const response = await app.request(
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
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.fail("STRING_ERROR");
    });

    const response = await app.request(
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

  it("should return success when sign up with fallback token-auth", async () => {
    const response = await app.request(
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

    const response = await app.request(
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
});

describe("POST /sign-in", () => {
  it("should return success when sign in is valid but no token", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed({ ...mockUser, sessionToken: null });
    });

    const response = await app.request(
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

  it("should return success when sign in is valid", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed(mockUser);
    });

    const response = await app.request(
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

    const response = await app.request(
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

    const response = await app.request(
      "/verify",
      {
        headers: { "X-Token": "valid-token" },
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

    const response = await app.request(
      "/verify",
      {
        headers: { "X-Token": "valid-token" },
        method: "GET"
      },
      {}
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ email: TEST_EMAIL });
  });

  it("should return 401 if token is missing", async () => {
    const response = await app.request(
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

    const response = await app.request(
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
});

describe("POST /verify", () => {
  it("should validate credentials", async () => {
    vi.mocked(carryUserAuthCommand).mockImplementationOnce(() => {
      return Effect.succeed(mockUser);
    });

    const response = await app.request(
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

    const response = await app.request(
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
    const response = await app.request("/", { method: "OPTIONS" });
    expect(response.status).toBe(204);
  });
});
