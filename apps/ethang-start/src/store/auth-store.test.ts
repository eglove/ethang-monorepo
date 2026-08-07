import { beforeEach, describe, expect, it, vi } from "vitest";

import { authStore, authStoreActions } from "./auth-store.ts";

const TEST_EMAIL = "test@ethang.email";
// eslint-disable-next-line sonar/no-hardcoded-passwords
const TEST_PASSWORD = "password123";
const SUCCESS_USER = {
  email: TEST_EMAIL,
  sessionToken: "tok-123",
  username: "testuser"
};

const mockSignIn = vi.hoisted(() => {
  return vi.fn();
});

vi.mock("../models/auth.ts", () => {
  return {
    getAuthState: vi.fn(async () => {
      return { isAuthenticated: false };
    }),
    signIn: mockSignIn
  };
});

describe("authStore", () => {
  beforeEach(() => {
    authStore.reset();
    vi.clearAllMocks();
  });

  it("starts with no user and not pending", () => {
    expect(authStore.state).toEqual({
      error: null,
      isPending: false,
      user: null
    });
  });

  it("sets error and isPending false on failed sign-in", async () => {
    mockSignIn.mockResolvedValueOnce({
      failure: new Error("Invalid Credentials")
    });

    await authStoreActions.signIn(TEST_EMAIL, "wrongpassword");

    expect(authStore.state.error).toBe("Invalid Credentials");
    expect(authStore.state.isPending).toBe(false);
    expect(authStore.state.user).toBeNull();
  });

  it("sets user and clears error and pending on successful sign-in", async () => {
    mockSignIn.mockResolvedValueOnce({ success: SUCCESS_USER });

    await authStoreActions.signIn(TEST_EMAIL, TEST_PASSWORD);

    expect(authStore.state.error).toBeNull();
    expect(authStore.state.isPending).toBe(false);
    expect(authStore.state.user).toEqual(SUCCESS_USER);
  });

  it("sets isPending true while sign-in is in flight", async () => {
    const { promise, resolve } = Promise.withResolvers<unknown>();
    mockSignIn.mockReturnValueOnce(promise);

    const pending = authStoreActions.signIn(TEST_EMAIL, TEST_PASSWORD);

    expect(authStore.state.isPending).toBe(true);

    resolve({ success: SUCCESS_USER });
    await pending;
  });
});
