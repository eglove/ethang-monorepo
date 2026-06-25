import { describe, expect, it, vi } from "vitest";

import app from "./index.js";
import { AuthService } from "./services/auth-service.js";

vi.mock("./get-database.ts", () => {
  return {
    getDatabase: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      query: {
        userTable: {
          findFirst: vi.fn()
        }
      },
      returning: vi.fn(),
      set: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    })
  };
});

vi.mock("./services/auth-service.js", () => {
  const AuthServiceMock = vi.fn().mockImplementation(() => {
    return {
      setAuthCookie: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn(),
      validateCredentials: vi.fn(),
      verifyToken: vi.fn()
    };
  });
  // @ts-expect-error test
  AuthServiceMock.AUTH_COOKIE_NAME = "ethang-auth-token";
  // @ts-expect-error test
  AuthServiceMock.TOKEN_SECRET_KEY = "token-auth";
  return {
    AuthService: AuthServiceMock
  };
});

const TEST_EMAIL = "test@test.com";
const TEST_PASSWORD = "password";
const TEST_USERNAME = "testuser";
const TEST_SECRET = "secret";
const SET_COOKIE = "Set-Cookie";

describe("POST /sign-up", () => {
  it("should return success when sign up is valid", async () => {
    const mockUser = { email: TEST_EMAIL, sessionToken: "token" };
    vi.mocked(AuthService).mockImplementation(function () {
      return {
        setAuthCookie: vi.fn((response: Response, token: string) => {
          response.headers.append(
            SET_COOKIE,
            `${AuthService.AUTH_COOKIE_NAME}=${token}`
          );
        }),
        signUp: vi.fn().mockResolvedValue(mockUser)
      };
    });

    const response = await app.request(
      "/sign-up",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          username: TEST_USERNAME
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

  it("should return error when sign up fails", async () => {
    vi.mocked(AuthService).mockImplementation(function () {
      return {
        signUp: vi.fn().mockResolvedValue(new Error("Sign up failed"))
      };
    });

    const response = await app.request(
      "/sign-up",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          username: TEST_USERNAME
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
  it("should return success when sign up is valid but no token", async () => {
    const mockUser = { email: TEST_EMAIL, sessionToken: null };
    vi.mocked(AuthService).mockImplementation(function () {
      return {
        setAuthCookie: vi.fn(),
        signUp: vi.fn().mockResolvedValue(mockUser)
      };
    });

    const response = await app.request(
      "/sign-up",
      {
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          username: TEST_USERNAME
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
});

describe("POST /sign-in", () => {
  it("should return success when sign in is valid but no token", async () => {
    const mockUser = { email: TEST_EMAIL, sessionToken: null };
    vi.mocked(AuthService).mockImplementation(function () {
      return {
        setAuthCookie: vi.fn(),
        signIn: vi.fn().mockResolvedValue(mockUser)
      };
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
  });
  it("should return success when sign in is valid", async () => {
    const mockUser = { email: TEST_EMAIL, sessionToken: "token" };
    vi.mocked(AuthService).mockImplementation(function () {
      return {
        setAuthCookie: vi.fn((response: Response, token: string) => {
          response.headers.append(
            SET_COOKIE,
            `${AuthService.AUTH_COOKIE_NAME}=${token}`
          );
        }),
        signIn: vi.fn().mockResolvedValue(mockUser)
      };
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

  it("should return error when sign in fails", async () => {
    vi.mocked(AuthService).mockImplementation(function () {
      return {
        signIn: vi.fn().mockResolvedValue(new Error("Unauthorized"))
      };
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
  it("should verify token", async () => {
    const mockPayload = { email: TEST_EMAIL };
    vi.mocked(AuthService).mockImplementation(function () {
      return {
        verifyToken: vi.fn().mockResolvedValue({ payload: mockPayload })
      };
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
    expect(body).toEqual(mockPayload);
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
    vi.mocked(AuthService).mockImplementation(function () {
      return {
        verifyToken: vi.fn().mockResolvedValue(new Error("Invalid token"))
      };
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
    const mockUser = { email: TEST_EMAIL };
    vi.mocked(AuthService).mockImplementation(function () {
      return {
        validateCredentials: vi.fn().mockResolvedValue(mockUser)
      };
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
    vi.mocked(AuthService).mockImplementation(function () {
      return {
        validateCredentials: vi
          .fn()
          .mockResolvedValue(new Error("Invalid Credentials"))
      };
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
