import { auth } from "@ethang/intl/en/auth.ts";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserCommand } from "../../domain/user/commands.ts";
import type { UserEvent } from "../../domain/user/events.ts";
import type { UserState } from "../../domain/user/state.ts";
import type { UserRepo } from "./repo.ts";

import { FetchError } from "../../errors/fetch-error.ts";
import { HashError } from "../../errors/hash-error.ts";
import { InvalidCredentialsError } from "../../errors/invalid-credentials-error.ts";
import { SaveError } from "../../errors/save-error.ts";
import { TokenSignError } from "../../errors/token-sign-error.ts";
import { TokenVerifyError } from "../../errors/token-verify-error.ts";
import { carryUserAuthCommand } from "./aggregate.ts";

const { decideMockRef } = vi.hoisted(() => {
  const reference: { value: null | ReturnType<typeof vi.fn> } = { value: null };
  return { decideMockRef: reference };
});

vi.mock("../../domain/user/aggregate.ts", async () => {
  const actual = await vi.importActual<
    typeof import("../../domain/user/aggregate.ts")
  >("../../domain/user/aggregate.ts");
  const mockedDecide = vi.fn();
  mockedDecide.mockImplementation((...arguments_) => {
    return actual.decide(...arguments_);
  });
  decideMockRef.value = mockedDecide;
  return {
    apply: actual.apply,
    decide: mockedDecide
  };
});

const {
  EMAIL,
  HASHED_PASSWORD,
  PASSWORD,
  TEST_JWT_TOKEN,
  TEST_USERNAME,
  USER_ID
} = auth;
const TEST_EMAIL = EMAIL;
const TEST_PASSWORD = PASSWORD;
const TEST_USERNAME_VALUE = TEST_USERNAME;
const TEST_USER_ID = USER_ID;
const TEST_TOKEN = TEST_JWT_TOKEN;
const TEST_HASH = HASHED_PASSWORD;
const UNKNOWN_EMAIL = "unknown@test.com";
const WRONG_VALUE = "wrong-value";
const DB_ERROR = "DB error";

const EXISTING_USER: { readonly id: string } & UserState = {
  email: TEST_EMAIL,
  id: TEST_USER_ID,
  lastLoggedIn: "2024-01-01T00:00:00.000Z",
  password: TEST_HASH,
  role: "user",
  sessionToken: "old-token",
  updatedAt: "2024-01-01T00:00:00.000Z",
  username: TEST_USERNAME_VALUE
};

type PasswordService = {
  compare: (
    password: string,
    hash: string
  ) => Effect.Effect<boolean, HashError>;
  hash: (password: string) => Effect.Effect<string, HashError>;
};

type TokenService = {
  sign: (
    payload: Record<string, string>
  ) => Effect.Effect<string, TokenSignError>;
  verify: (
    token: string
  ) => Effect.Effect<{ payload: Record<string, string> }, TokenVerifyError>;
};

const mockSucceed = <T>(value: T) => {
  return Effect.succeed(value);
};

const mockFail = <E>(error: E) => {
  return Effect.fail(error);
};

const createMockRepo = (overrides?: Partial<UserRepo>): UserRepo => {
  return {
    fetch: vi.fn().mockReturnValue(mockSucceed(null)),
    save: vi.fn().mockReturnValue(mockSucceed(EXISTING_USER)),
    ...overrides
  };
};

const createMockPasswordService = (
  overrides?: Partial<PasswordService>
): PasswordService => {
  return {
    compare: vi.fn().mockReturnValue(mockSucceed(true)),
    hash: vi.fn().mockReturnValue(mockSucceed(TEST_HASH)),
    ...overrides
  };
};

const createMockTokenService = (
  overrides?: Partial<TokenService>
): TokenService => {
  return {
    sign: vi.fn().mockReturnValue(mockSucceed(TEST_TOKEN)),
    verify: vi
      .fn()
      .mockReturnValue(mockSucceed({ payload: { email: TEST_EMAIL } })),
    ...overrides
  };
};

const fetchUser = (user: typeof EXISTING_USER) => {
  return vi.fn().mockReturnValue(mockSucceed(user));
};

const comparePassword = (isValid: boolean) => {
  return vi.fn().mockReturnValue(mockSucceed(isValid));
};

const makeSignUpCommand = (overrides?: {
  email?: string;
  password?: string;
  username?: string;
}) => {
  const command: UserCommand = {
    email: TEST_EMAIL,
    kind: "SignUp",
    password: TEST_PASSWORD,
    username: TEST_USERNAME_VALUE,
    ...overrides
  };
  return command;
};

const makeSignInCommand = (overrides?: {
  email?: string;
  password?: string;
}) => {
  const command: UserCommand = {
    email: TEST_EMAIL,
    kind: "SignIn",
    password: TEST_PASSWORD,
    ...overrides
  };
  return command;
};

describe("SignUp", () => {
  it("creates a new user when no existing user is found", async () => {
    const repo = createMockRepo();
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();
    const command = makeSignUpCommand();

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService)
    );

    expect(result).toStrictEqual(EXISTING_USER);
    expect(tokenService.sign).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it("signs in when user already exists", async () => {
    const repo = createMockRepo({ fetch: fetchUser(EXISTING_USER) });
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();
    const command = makeSignUpCommand();

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService)
    );

    expect(result).toStrictEqual(EXISTING_USER);
    expect(passwordService.compare).toHaveBeenCalledWith(
      TEST_PASSWORD,
      TEST_HASH
    );
    expect(tokenService.sign).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it("fails with error when SignUp password does not match", async () => {
    const repo = createMockRepo({ fetch: fetchUser(EXISTING_USER) });
    const passwordService = createMockPasswordService({
      compare: comparePassword(false)
    });
    const tokenService = createMockTokenService();
    const command = makeSignUpCommand({ password: WRONG_VALUE });

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService).pipe(
        Effect.flip
      )
    );

    expect(result).toBeInstanceOf(InvalidCredentialsError);
  });

  it("propagates fetch errors", async () => {
    const fetchError = mockFail(new FetchError(DB_ERROR));
    const repo = createMockRepo({
      fetch: vi.fn().mockReturnValue(fetchError)
    });
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();
    const command = makeSignUpCommand();

    await expect(
      Effect.runPromise(
        carryUserAuthCommand(command, repo, passwordService, tokenService)
      )
    ).rejects.toThrow(DB_ERROR);
  });
});

describe("SignIn", () => {
  it("signs in successfully with valid credentials", async () => {
    const repo = createMockRepo({ fetch: fetchUser(EXISTING_USER) });
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();
    const command = makeSignInCommand();

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService)
    );

    expect(result).toStrictEqual(EXISTING_USER);
    expect(passwordService.compare).toHaveBeenCalledWith(
      TEST_PASSWORD,
      TEST_HASH
    );
    expect(tokenService.sign).toHaveBeenCalled();
  });

  it("fails with error when SignIn password does not match", async () => {
    const repo = createMockRepo({ fetch: fetchUser(EXISTING_USER) });
    const passwordService = createMockPasswordService({
      compare: comparePassword(false)
    });
    const tokenService = createMockTokenService();
    const command = makeSignInCommand({ password: WRONG_VALUE });

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService).pipe(
        Effect.flip
      )
    );

    expect(result).toBeInstanceOf(InvalidCredentialsError);
  });

  it("fails with InvalidCredentialsError when user not found", async () => {
    const repo = createMockRepo();
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();
    const command = makeSignInCommand({ email: UNKNOWN_EMAIL });

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService).pipe(
        Effect.flip
      )
    );

    expect(result).toBeInstanceOf(InvalidCredentialsError);
  });

  it("fails with InvalidCredentialsError when existing user has null password", async () => {
    const repo = createMockRepo({
      fetch: fetchUser({ ...EXISTING_USER, password: null })
    });
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();
    const command = makeSignInCommand();

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService).pipe(
        Effect.flip
      )
    );

    expect(result).toBeInstanceOf(InvalidCredentialsError);
  });
});

describe("unexpected event from decide", () => {
  it("fails with error when decide returns a non-SignInOrUpEvent", async () => {
    decideMockRef.value!.mockImplementationOnce(() => {
      return [
        {
          email: "test@test.com",
          kind: "CredentialsValidated"
        } as UserEvent
      ];
    });

    const repo = createMockRepo();
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();
    const command = makeSignUpCommand();

    await expect(
      Effect.runPromise(
        carryUserAuthCommand(command, repo, passwordService, tokenService)
      )
    ).rejects.toThrow("Unexpected event type");
  });
});

describe("ValidateCredentials", () => {
  it("validates credentials successfully", async () => {
    const repo = createMockRepo({ fetch: fetchUser(EXISTING_USER) });
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();

    const command: UserCommand = {
      email: TEST_EMAIL,
      kind: "ValidateCredentials",
      password: TEST_PASSWORD
    };

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService)
    );

    expect(result).toStrictEqual(EXISTING_USER);
    expect(passwordService.compare).toHaveBeenCalledWith(
      TEST_PASSWORD,
      TEST_HASH
    );
  });

  it("fails with InvalidCredentialsError when user not found", async () => {
    const repo = createMockRepo();
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();

    const command: UserCommand = {
      email: UNKNOWN_EMAIL,
      kind: "ValidateCredentials",
      password: TEST_PASSWORD
    };

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService).pipe(
        Effect.flip
      )
    );

    expect(result).toBeInstanceOf(InvalidCredentialsError);
  });

  it("fails with InvalidCredentialsError when user has null password", async () => {
    const repo = createMockRepo({
      fetch: fetchUser({ ...EXISTING_USER, password: null })
    });
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();

    const command: UserCommand = {
      email: TEST_EMAIL,
      kind: "ValidateCredentials",
      password: TEST_PASSWORD
    };

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService).pipe(
        Effect.flip
      )
    );

    expect(result).toBeInstanceOf(InvalidCredentialsError);
  });

  it("fails with error when ValidateCredentials password does not match", async () => {
    const repo = createMockRepo({ fetch: fetchUser(EXISTING_USER) });
    const passwordService = createMockPasswordService({
      compare: comparePassword(false)
    });
    const tokenService = createMockTokenService();

    const command: UserCommand = {
      email: TEST_EMAIL,
      kind: "ValidateCredentials",
      password: WRONG_VALUE
    };

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService).pipe(
        Effect.flip
      )
    );

    expect(result).toBeInstanceOf(InvalidCredentialsError);
  });
});

describe("VerifyToken", () => {
  it("verifies a token successfully", async () => {
    const repo = createMockRepo();
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();

    const command: UserCommand = {
      kind: "VerifyToken",
      token: TEST_TOKEN
    };

    const result = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService)
    );

    expect(result).toStrictEqual({ payload: { email: TEST_EMAIL } });
    expect(tokenService.verify).toHaveBeenCalledWith(TEST_TOKEN);
  });

  it("propagates token verification errors", async () => {
    const repo = createMockRepo();
    const passwordService = createMockPasswordService();
    const verifyError = mockFail(new TokenVerifyError("Invalid token"));
    const tokenService = createMockTokenService({
      verify: vi.fn().mockReturnValue(verifyError)
    });

    const command: UserCommand = {
      kind: "VerifyToken",
      token: "invalid-token"
    };

    await expect(
      Effect.runPromise(
        carryUserAuthCommand(command, repo, passwordService, tokenService)
      )
    ).rejects.toThrow("Invalid token");
  });
});

describe("error propagation", () => {
  it("propagates save errors", async () => {
    const saveError = mockFail(new SaveError("Save failed"));
    const repo = createMockRepo({
      save: vi.fn().mockReturnValue(saveError)
    });
    const passwordService = createMockPasswordService();
    const tokenService = createMockTokenService();
    const command = makeSignUpCommand();

    await expect(
      Effect.runPromise(
        carryUserAuthCommand(command, repo, passwordService, tokenService)
      )
    ).rejects.toThrow("Save failed");
  });

  it("propagates hash errors", async () => {
    const repo = createMockRepo();
    const hashError = mockFail(new HashError("Hash failed"));
    const passwordService = createMockPasswordService({
      hash: vi.fn().mockReturnValue(hashError)
    });
    const tokenService = createMockTokenService();
    const command = makeSignUpCommand();

    await expect(
      Effect.runPromise(
        carryUserAuthCommand(command, repo, passwordService, tokenService)
      )
    ).rejects.toThrow("Hash failed");
  });
});
