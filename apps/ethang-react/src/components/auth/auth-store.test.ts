import { beforeEach, describe, expect, it, vi } from "vitest";

import { authStore, authStoreActions, readStoredUser } from "./auth-store.ts";

const USER_KEY = "ethang-user";
const TEST_EMAIL = "test@ethang.email";
const STORED_EMAIL = "stored@ethang.email";

describe("AuthStore", () => {
  beforeEach(() => {
    localStorage.clear();
    authStoreActions.signOut();
    vi.restoreAllMocks();
  });

  it("should initialize with null user", () => {
    expect(authStore.state.user).toBeNull();
    expect(authStore.state.error).toBeNull();
    expect(authStore.state.isPending).toBe(false);
  });

  it("should read user from localStorage if present", () => {
    const mockUser = {
      email: STORED_EMAIL,
      sessionToken: "stored-token",
      username: "storeduser"
    };
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));

    expect(readStoredUser()).toEqual(mockUser);
  });

  it("should handle JSON parse error in localStorage during initialization", () => {
    localStorage.setItem(USER_KEY, "{invalid-json}");
    expect(readStoredUser()).toBeNull();
  });

  it("should handle invalid user schema in localStorage during initialization", () => {
    localStorage.setItem(USER_KEY, JSON.stringify({ email: 123 }));
    expect(readStoredUser()).toBeNull();
  });

  it("should successfully sign in and update store/localStorage", async () => {
    const mockUser = {
      email: TEST_EMAIL,
      sessionToken: "mock-session-token",
      username: "testuser"
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(mockUser, { status: 200 }));

    const signInPromise = authStoreActions.signIn(TEST_EMAIL, "password123");

    expect(authStore.state.isPending).toBe(true);

    await signInPromise;

    expect(fetchSpy).toHaveBeenCalledWith("https://auth.ethang.dev/sign-in", {
      // eslint-disable-next-line sonar/no-hardcoded-passwords
      body: JSON.stringify({ email: TEST_EMAIL, password: "password123" }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    expect(authStore.state.user).toEqual(mockUser);
    expect(authStore.state.isPending).toBe(false);
    expect(authStore.state.error).toBeNull();

    expect(localStorage.getItem(USER_KEY)).toBe(JSON.stringify(mockUser));
  });

  it("should handle sign in error and set error in store", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { error: "Invalid Credentials" },
        {
          status: 401
        }
      )
    );

    await authStoreActions.signIn(TEST_EMAIL, "wrongpassword");

    expect(authStore.state.user).toBeNull();
    expect(authStore.state.isPending).toBe(false);
    expect(authStore.state.error).toBe("Invalid Credentials");
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it("should handle sign in error without specific error message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({}, { status: 400 })
    );

    await authStoreActions.signIn(TEST_EMAIL, "wrongpassword");

    expect(authStore.state.error).toBe("Failed to sign in");
  });

  it("should handle sign in error when request throws exception without message", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue({});

    await authStoreActions.signIn(TEST_EMAIL, "password");

    expect(authStore.state.error).toBe("An unexpected error occurred");
  });

  it("should handle invalid response schema from server", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ email: 123 }, { status: 200 })
    );

    await authStoreActions.signIn(TEST_EMAIL, "password123");

    expect(authStore.state.user).toBeNull();
    expect(authStore.state.isPending).toBe(false);
    expect(authStore.state.error).toBe("Invalid response from server");
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it("should sign out and clear store/localStorage", () => {
    const mockUser = {
      email: TEST_EMAIL,
      sessionToken: "mock-session-token",
      username: "testuser"
    };

    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));

    authStore.update((draft) => {
      draft.error = null;
      draft.isPending = false;
      draft.user = mockUser;
    });

    expect(authStore.state.user).toEqual(mockUser);

    authStoreActions.signOut();

    expect(authStore.state.user).toBeNull();
    expect(authStore.state.isPending).toBe(false);
    expect(authStore.state.error).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});
