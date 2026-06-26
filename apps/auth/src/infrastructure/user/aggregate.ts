import { auth } from "@ethang/intl/en/auth.ts";
import { Effect } from "effect";

import type { UserCommand } from "../../domain/user/commands.ts";
import type { UserEvent } from "../../domain/user/events.ts";
import type { HashError } from "../../errors/hash-error.ts";
import type { TokenSignError } from "../../errors/token-sign-error.ts";
import type { TokenVerifyError } from "../../errors/token-verify-error.ts";
import type { UserRepo } from "./repo.ts";

import { apply, decide } from "../../domain/user/aggregate.ts";
import { initialState, type UserState } from "../../domain/user/state.ts";
import { InvalidCredentialsError } from "../../errors/invalid-credentials-error.ts";

type PasswordService = {
  readonly compare: (
    password: string,
    hash: string
  ) => Effect.Effect<boolean, HashError>;
  readonly hash: (password: string) => Effect.Effect<string, HashError>;
};

type TokenService = {
  readonly sign: (
    payload: Record<string, string>
  ) => Effect.Effect<string, TokenSignError>;
  readonly verify: (
    token: string
  ) => Effect.Effect<{ payload: Record<string, string> }, TokenVerifyError>;
};

export const carryUserAuthCommand = (
  command: UserCommand,
  repo: UserRepo,
  passwordService: PasswordService,
  tokenService: TokenService
): Effect.Effect<
  { payload: Record<string, string> } | ({ readonly id: string } & UserState),
  Error
> => {
  switch (command.kind) {
    case "SignIn":
    case "SignUp": {
      return handleSignInOrUp(command, repo, passwordService, tokenService);
    }
    case "ValidateCredentials": {
      return handleValidateCredentials(command, repo, passwordService);
    }
    case "VerifyToken": {
      return tokenService.verify(command.token);
    }
  }
};

const assertValidCredentials = (
  password: string,
  hash: string,
  passwordService: PasswordService
) => {
  return Effect.gen(function* () {
    const isValid = yield* passwordService.compare(password, hash);
    if (!isValid) {
      return yield* Effect.fail(
        new InvalidCredentialsError(auth.INVALID_CREDENTIALS)
      );
    }
  });
};

const handleValidateCredentials = (
  command: Extract<UserCommand, { kind: "ValidateCredentials" }>,
  repo: UserRepo,
  passwordService: PasswordService
) => {
  return Effect.gen(function* () {
    const existing = yield* repo.fetch(command.email);
    if (null === existing) {
      return yield* Effect.fail(
        new InvalidCredentialsError(auth.INVALID_CREDENTIALS)
      );
    }
    const actualPassword = existing.password;
    if (null === actualPassword) {
      return yield* Effect.fail(
        new InvalidCredentialsError(auth.INVALID_CREDENTIALS)
      );
    }
    yield* assertValidCredentials(
      command.password,
      actualPassword,
      passwordService
    );
    return existing;
  });
};

type SignInOrUpEvent = Extract<
  UserEvent,
  { kind: "UserCreated" | "UserSignedIn" }
>;

const isSignInOrUpEvent = (event: UserEvent): event is SignInOrUpEvent => {
  return "UserCreated" === event.kind || "UserSignedIn" === event.kind;
};

const processSignInOrUpEvent = (
  event: SignInOrUpEvent,
  state: UserState,
  password: string,
  existing: ({ readonly id: string } & UserState) | null,
  passwordService: PasswordService
): Effect.Effect<UserState, HashError | InvalidCredentialsError> => {
  switch (event.kind) {
    case "UserCreated": {
      return Effect.gen(function* () {
        const hashedPassword = yield* passwordService.hash(password);
        return apply(state, { ...event, password: hashedPassword });
      });
    }
    case "UserSignedIn": {
      if (null === existing) {
        return Effect.fail(
          new InvalidCredentialsError(auth.INVALID_CREDENTIALS)
        );
      }
      const actualPassword = existing.password;
      if (null === actualPassword) {
        return Effect.fail(
          new InvalidCredentialsError(auth.INVALID_CREDENTIALS)
        );
      }
      return Effect.gen(function* () {
        yield* assertValidCredentials(
          password,
          actualPassword,
          passwordService
        );
        const rehashedPassword = yield* passwordService.hash(password);
        let newState = apply(state, event);
        newState = { ...newState, password: rehashedPassword };
        return newState;
      });
    }
  }
};

const handleSignInOrUp = (
  command: Extract<UserCommand, { kind: "SignIn" | "SignUp" }>,
  repo: UserRepo,
  passwordService: PasswordService,
  tokenService: TokenService
) => {
  return Effect.gen(function* () {
    const existing = yield* repo.fetch(command.email);
    const state = existing ?? initialState;
    const events = decide(command, state);

    let newState = state;
    for (const event of events) {
      if (!isSignInOrUpEvent(event)) {
        return yield* Effect.fail(new Error("Unexpected event type"));
      }
      newState = yield* processSignInOrUpEvent(
        event,
        newState,
        command.password,
        existing,
        passwordService
      );
    }

    const token = yield* tokenService.sign({
      email: newState.email,
      sub: newState.id ?? ""
    });
    newState = { ...newState, sessionToken: token };

    return yield* repo.save(newState, existing?.id ?? null);
  });
};
