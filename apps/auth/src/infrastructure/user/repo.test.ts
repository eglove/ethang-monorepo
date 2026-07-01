import { auth } from "@ethang/intl/en/auth.ts";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserState } from "../../domain/user/state.ts";

import { FetchError } from "../../errors/fetch-error.ts";
import { SaveError } from "../../errors/save-error.ts";
import { createUserRepo } from "./repo.ts";

const { EMAIL, HASHED_PASSWORD, TEST_USERNAME, USER_ID } = auth;
const TEST_EMAIL = EMAIL;
const TEST_USER_ID = USER_ID;
const TEST_USERNAME_VALUE = TEST_USERNAME;
const TEST_SESSION_TOKEN = "token-123";
const LAST_LOGGED_IN = "2024-01-01T00:00:00.000Z";
const ROLE = "user";

const ROW = {
  email: TEST_EMAIL,
  id: TEST_USER_ID,
  lastLoggedIn: LAST_LOGGED_IN,
  password: HASHED_PASSWORD,
  role: ROLE,
  sessionToken: TEST_SESSION_TOKEN,
  updatedAt: LAST_LOGGED_IN,
  username: TEST_USERNAME_VALUE
};

const EXPECTED_STATE: { readonly id: string } & UserState = {
  email: TEST_EMAIL,
  id: TEST_USER_ID,
  lastLoggedIn: LAST_LOGGED_IN,
  password: HASHED_PASSWORD,
  role: ROLE,
  sessionToken: TEST_SESSION_TOKEN,
  updatedAt: LAST_LOGGED_IN,
  username: TEST_USERNAME_VALUE
};

const STATE: UserState = {
  email: TEST_EMAIL,
  id: null,
  lastLoggedIn: LAST_LOGGED_IN,
  password: HASHED_PASSWORD,
  role: ROLE,
  sessionToken: TEST_SESSION_TOKEN,
  updatedAt: null,
  username: TEST_USERNAME_VALUE
};

const createMockDatabase = () => {
  const { findFirstMock, insertReturningMock, updateRunMock } = {
    findFirstMock: vi.fn(),
    insertReturningMock: vi.fn(),
    updateRunMock: vi.fn()
  };

  const database = {
    insert: vi.fn(() => {
      return {
        values: vi.fn(() => {
          return {
            returning: insertReturningMock
          };
        })
      };
    }),
    query: {
      userTable: {
        findFirst: findFirstMock
      }
    },
    update: vi.fn(() => {
      return {
        set: vi.fn(() => {
          return {
            where: vi.fn(() => {
              return {
                run: updateRunMock
              };
            })
          };
        })
      };
    })
  } as any;

  return {
    database,
    findFirstMock,
    insertReturningMock,
    updateRunMock
  };
};

describe("createUserRepo", () => {
  describe("fetch", () => {
    it("returns state when user is found by email", async () => {
      const { database, findFirstMock } = createMockDatabase();
      findFirstMock.mockResolvedValue(ROW);

      const repo = createUserRepo(database);
      const result = await Effect.runPromise(repo.fetch(TEST_EMAIL));

      expect(result).toStrictEqual(EXPECTED_STATE);
    });

    it("returns null when no user is found", async () => {
      const { database, findFirstMock } = createMockDatabase();
      findFirstMock.mockResolvedValue(undefined);

      const repo = createUserRepo(database);
      const result = await Effect.runPromise(repo.fetch(TEST_EMAIL));

      expect(result).toBeNull();
    });

    it("fails with FetchError on database error", async () => {
      const { database, findFirstMock } = createMockDatabase();
      findFirstMock.mockRejectedValue(new Error("Connection lost"));

      const repo = createUserRepo(database);
      const result = await Effect.runPromise(
        repo.fetch(TEST_EMAIL).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(FetchError);
      expect(result.message).toContain("Connection lost");
    });
  });

  describe("save", () => {
    it("inserts new user when version is null", async () => {
      const { database, insertReturningMock } = createMockDatabase();
      insertReturningMock.mockResolvedValue([ROW]);

      const repo = createUserRepo(database);
      const result = await Effect.runPromise(repo.save(STATE, null));

      expect(result).toStrictEqual(EXPECTED_STATE);
    });

    it("fails with SaveError when insert returns no rows", async () => {
      const { database, insertReturningMock } = createMockDatabase();
      insertReturningMock.mockResolvedValue([]);

      const repo = createUserRepo(database);
      const result = await Effect.runPromise(
        repo.save(STATE, null).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(SaveError);
      expect(result.message).toContain("Insert returned no rows");
    });

    it("updates existing user when version is provided", async () => {
      const { database, updateRunMock } = createMockDatabase();
      updateRunMock.mockResolvedValue(undefined);

      const repo = createUserRepo(database);
      const result = await Effect.runPromise(repo.save(STATE, TEST_USER_ID));

      expect(result).toStrictEqual({ ...STATE, id: TEST_USER_ID });
    });

    it("fails with SaveError on database error during insert", async () => {
      const { database, insertReturningMock } = createMockDatabase();
      insertReturningMock.mockRejectedValue(new Error("Insert failed"));

      const repo = createUserRepo(database);
      const result = await Effect.runPromise(
        repo.save(STATE, null).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(SaveError);
      expect(result.message).toContain("Insert failed");
    });

    it("inserts with empty string password when state password is null", async () => {
      const NULL_PASSWORD_STATE: UserState = { ...STATE, password: null };
      const EXPECTED_NULL_PASSWORD_ROW = {
        ...ROW,
        password: ""
      };
      const { database, insertReturningMock } = createMockDatabase();
      insertReturningMock.mockResolvedValue([EXPECTED_NULL_PASSWORD_ROW]);

      const repo = createUserRepo(database);
      const result = await Effect.runPromise(
        repo.save(NULL_PASSWORD_STATE, null)
      );

      expect(result.password).toBe("");
    });

    it("updates with empty string password when state password is null", async () => {
      const NULL_PASSWORD_STATE: UserState = { ...STATE, password: null };
      const { database, updateRunMock } = createMockDatabase();
      updateRunMock.mockResolvedValue(undefined);

      const repo = createUserRepo(database);
      const result = await Effect.runPromise(
        repo.save(NULL_PASSWORD_STATE, TEST_USER_ID)
      );

      expect(result.password).toBeNull();
      expect(result.id).toBe(TEST_USER_ID);
    });
  });
});
